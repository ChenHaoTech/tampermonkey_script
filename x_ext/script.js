// ==UserScript==
// @name         x-Spotlight
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Highlight quality posts on X/Twitter
// @author       You
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==


(function () {
    'use strict';

    // 首先定义默认配置
    const DEFAULT_CONFIG = {
        LIKE_RATIO_THRESHOLD: 0.01,     // 1% 点赞率阈值
        COMMENT_RATIO_THRESHOLD: 0.001,  // 0.1% 评论率阈值
        RETWEET_THRESHOLD: 3,           // 转发数阈值
        VIEW_THRESHOLD: 100,            // 浏览数阈值
        CHECK_INTERVAL: 1000,           // 检查间隔（毫秒）
    };

    // 然后是加载配置的函数
    const loadConfig = () => {
        const savedConfig = {};
        Object.keys(DEFAULT_CONFIG).forEach(key => {
            savedConfig[key] = GM_getValue(key, DEFAULT_CONFIG[key]);
        });
        return savedConfig;
    };

    // 修改 CONFIG 的定义
    const CONFIG = loadConfig();

    // 添加保存配置的函数
    const saveConfig = () => {
        Object.keys(CONFIG).forEach(key => {
            GM_setValue(key, CONFIG[key]);
        });
        logger.info('Configuration saved');
    };

    // 日志方法
    const logger = {
        _format: (level, ...args) => {
            return [`[x-Spotlight][${level}]:`, ...args];
        },

        debug: (...args) => console.debug(...logger._format('DEBUG', ...args)),
        info: (...args) => console.info(...logger._format('INFO', ...args)),
        warn: (...args) => console.warn(...logger._format('WARN', ...args)),
        error: (...args) => console.error(...logger._format('ERROR', ...args)),
    };
    logger.info('logger init success');

    // 样式注入
    const injectStyles = () => {
        const styles = `
            .quality-post {
                border: 2px solid #1da1f2 !important;
                transition: border-width 0.3s ease;
            }
            .quality-post[data-engagement-level="high"] {
                border-width: 4px !important;
            }
            .quality-post[data-engagement-level="very-high"] {
                border-width: 6px !important;
            }
            .highlight-comments {
                color: #1da1f2 !important;
                font-weight: bold !important;
            }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    };

    // 解析数字文本（处理 "1.2K", "12.3M" 等格式）
    const parseNumberText = (text) => {
        if (!text) return 0;
        const num = parseFloat(text.replace(/,/g, ''));
        const multiplier = text.slice(-1).toUpperCase();
        switch (multiplier) {
            case 'K': return num * 1000;
            case 'M': return num * 1000000;
            case 'B': return num * 1000000000;
            default: return num;
        }
    };

    // 处理单个推文
    const processPost = (postElement) => {
        // 防止重复处理
        if (postElement.dataset.processed) return;
        // 获取指标数据
        // Get the parent element containing all metrics
        const metricsContainer = postElement.querySelector('[role="group"][aria-label]');
        if (!metricsContainer) {
            logger.info('No metrics container found for post');
            return;
        }
        logger.info('begin processPost');

        let views = 0, likes = 0, comments = 0, retweets = 0;

        // Parse the aria-label which contains all metrics
        const metricsText = metricsContainer.getAttribute('aria-label');
        if (metricsText) {
            const matches = {
                replies: metricsText.match(/(\d+)\s+repl(y|ies)/i),
                reposts: metricsText.match(/(\d+)\s+repost/i),
                likes: metricsText.match(/(\d+)\s+like/i),
                views: metricsText.match(/(\d+)\s+view/i)
            };

            comments = matches.replies ? parseInt(matches.replies[1]) : 0;
            retweets = matches.reposts ? parseInt(matches.reposts[1]) : 0;
            likes = matches.likes ? parseInt(matches.likes[1]) : 0;
            views = matches.views ? parseInt(matches.views[1]) : 0;
        }

        // 计算比率
        const likeRatio = views ? likes / views : 0;
        const commentRatio = views ? comments / views : 0;

        // 应用高亮 - 添加浏览数判断条件
        if (views <= CONFIG.VIEW_THRESHOLD) {
            logger.info('views <= CONFIG.VIEW_THRESHOLD: ' + CONFIG.VIEW_THRESHOLD);
            return;
        }

        if (likeRatio > CONFIG.LIKE_RATIO_THRESHOLD) {
            postElement.classList.add('quality-post');
            // 根据比率设置边框粗细
            if (likeRatio > CONFIG.LIKE_RATIO_THRESHOLD * 2) {
                postElement.dataset.engagementLevel = 'very-high';
            } else {
                postElement.dataset.engagementLevel = 'high';
            }
        }

        if (commentRatio > CONFIG.COMMENT_RATIO_THRESHOLD || retweets > CONFIG.RETWEET_THRESHOLD) {
            const commentButton = postElement.querySelector('[data-testid="reply"]');
            if (commentButton) {
                commentButton.classList.add('highlight-comments');
            }
        }
        postElement.dataset.processed = 'true';
    };

    // 监视 DOM 变化
    const observeTimeline = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 查找推文元素
                        const posts = node.querySelectorAll('article');
                        posts.forEach(processPost);
                    }
                });
            });
        });

        // 开始观察
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };
    // 添加配置菜单
    const registerConfigMenus = () => {
        // 创建对话框
        const dialog = document.createElement('dialog');
        dialog.id = 'x-spotlight-config';
        dialog.style.cssText = `
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ccc;
            background: white;
        `;

        // 创建配置表单
        const form = document.createElement('form');
        form.innerHTML = `
            <h2 style="margin-top:0">X-Spotlight 配置</h2>
            <div style="margin-bottom:15px">
                <label>点赞率阈值 (%)</label>
                <input type="number" id="like-ratio" value="${CONFIG.LIKE_RATIO_THRESHOLD * 100}" min="0" step="0.1">
            </div>
            <div style="margin-bottom:15px">
                <label>评论率阈值 (%)</label>
                <input type="number" id="comment-ratio" value="${CONFIG.COMMENT_RATIO_THRESHOLD * 100}" min="0" step="0.1">
            </div>
            <div style="margin-bottom:15px">
                <label>最小转发数</label>
                <input type="number" id="retweet-threshold" value="${CONFIG.RETWEET_THRESHOLD}" min="0">
            </div>
            <div style="margin-bottom:15px">
                <label>最小浏览数</label>
                <input type="number" id="view-threshold" value="${CONFIG.VIEW_THRESHOLD}" min="0">
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:20px">
                <button type="button" id="reset-btn">重置默认值</button>
                <div>
                    <button type="button" id="cancel-btn">取消</button>
                    <button type="submit">保存</button>
                </div>
            </div>
        `;

        dialog.appendChild(form);
        document.body.appendChild(dialog);

        // 事件处理
        const handleSubmit = (e) => {
            e.preventDefault();
            CONFIG.LIKE_RATIO_THRESHOLD = parseFloat(document.getElementById('like-ratio').value) / 100;
            CONFIG.COMMENT_RATIO_THRESHOLD = parseFloat(document.getElementById('comment-ratio').value) / 100;
            CONFIG.RETWEET_THRESHOLD = parseInt(document.getElementById('retweet-threshold').value);
            CONFIG.VIEW_THRESHOLD = parseInt(document.getElementById('view-threshold').value);
            saveConfig();
            refreshPosts();
            dialog.close();
        };

        const handleReset = () => {
            if (confirm("确定要重置所有配置到默认值吗？")) {
                Object.assign(CONFIG, DEFAULT_CONFIG);
                saveConfig();
                refreshPosts();
                dialog.close();
            }
        };

        form.addEventListener('submit', handleSubmit);
        document.getElementById('reset-btn').addEventListener('click', handleReset);
        document.getElementById('cancel-btn').addEventListener('click', () => dialog.close());

        // 添加打开配置的按钮
        const configButton = document.createElement('button');
        configButton.textContent = 'X-Spotlight 配置';
        configButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 8px 16px;
            background: #1da1f2;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
        `;
        configButton.addEventListener('click', () => dialog.showModal());
        document.body.appendChild(configButton);
    };

    // 刷新所有帖子的处理
    const refreshPosts = () => {
        document.querySelectorAll('article[role="article"]').forEach(post => {
            post.dataset.processed = '';
            processPost(post);
        });
    };

    // 初始化
    const init = () => {
        logger.info('init');
        injectStyles();
        registerConfigMenus();
        logger.info('injectStyles success');
        observeTimeline();
        logger.info('observeTimeline success');

        // 处理已存在的推文
        setInterval(() => {
            document.querySelectorAll('article[role="article"]:not([data-processed])').forEach(processPost);
        }, CONFIG.CHECK_INTERVAL);
        logger.info('setInterval for processPost success');
    };

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
// ==/UserScript==
// ==UserScript==
// @name         x-Spotlight
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Highlight quality posts on X/Twitter
// @author       You
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_notification

// ==/UserScript==


(function () {
    'use strict';



    // 配置参数
    const CONFIG = {
        LIKE_RATIO_THRESHOLD: 0.01,     // 1% 点赞率阈值
        COMMENT_RATIO_THRESHOLD: 0.001,  // 0.1% 评论率阈值
        RETWEET_THRESHOLD: 3,           // 转发数阈值
        CHECK_INTERVAL: 1000,           // 检查间隔（毫秒）
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
        postElement.dataset.processed = 'true';

        // 获取指标数据
        const metrics = postElement.querySelectorAll('[data-testid="analyticsButton"]');
        if (!metrics.length) {
            logger.info('No metrics found for post');
            return;
        }

        let views = 0, likes = 0, comments = 0, retweets = 0;

        metrics.forEach(metric => {
            const text = metric.textContent;
            const number = parseNumberText(text);

            if (metric.closest('[aria-label*="View"]')) views = number;
            if (metric.closest('[aria-label*="Like"]')) likes = number;
            if (metric.closest('[aria-label*="Reply"]')) comments = number;
            if (metric.closest('[aria-label*="Retweet"]')) retweets = number;
        }); 

        // 计算比率
        const likeRatio = views ? likes / views : 0;
        const commentRatio = views ? comments / views : 0;

        // 应用高亮
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

    // 初始化
    const init = () => {
        logger.info('init');
        injectStyles();
        observeTimeline();

        // 处理已存在的推文
        setInterval(() => {
            document.querySelectorAll('article:not([data-processed])').forEach(processPost);
        }, CONFIG.CHECK_INTERVAL);
    };

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
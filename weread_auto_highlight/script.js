// ==UserScript==

// ==/UserScript==

(function () {
    'use strict';
    /* 业务无关函数 */
    const log = (...args) => console.log("weread_ext:", ...args);


    const toolXpath = "//div[contains(@class,'reader_toolbar_container')]//div[contains(@class,'reader_toolbar_content')]//button[2]";
    // toolXpath>underlineBg
    const toolMarkXpath = "//div[contains(@class,'reader_toolbar_container')]//button[contains(@class,'underlineBg')]";
    // toolXpath>removeUnderline 
    const removeMakrXpath = "//div[contains(@class,'reader_toolbar_container')]//button[contains(@class,'removeUnderline')]";
    // toolXpath>wr_copy
    const copyMarkXpath = "//div[contains(@class,'reader_toolbar_container')]//button[contains(@class,'wr_copy')]";
    // toolXpath>review
    const writeXpath = "//div[contains(@class,'reader_toolbar_container')]//button[contains(@class,'review')]";
    //readerControls_item dark
    const settingTemplateXpath = "//div[contains(@class,'readerControls_item_dark')]";

    // 自动划线设置的存储管理类
    class AutoHighlightSettings {
        constructor() {
            this.storageKey = 'weread_auto_highlight_enabled';
        }

        // 获取自动划线设置状态
        isEnabled() {
            const value = GM_getValue(this.storageKey);
            return value === undefined ? false : value;
        }

        // 设置自动划线状态
        setEnabled(enabled) {
            GM_setValue(this.storageKey, enabled);
        }

        // 切换自动划线状态
        toggle() {
            const currentState = this.isEnabled();
            this.setEnabled(!currentState);
            return !currentState;
        }
    }
    const autoHighlightSettings = new AutoHighlightSettings();

    // 创建一个  ToolElements 实例
    class ToolElements {
        constructor() {
            // tools 元素是否存在
            const toolElement = document.evaluate(toolXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            this.exist = toolElement !== null && toolElement.style.display !== 'none' && toolElement.offsetParent !== null;
            this.toolMarkElement = document.evaluate(toolMarkXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            this.removeMarkElement = document.evaluate(removeMakrXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            this.copyMarkElement = document.evaluate(copyMarkXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            this.writeElement = document.evaluate(writeXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
    }
    class ToolElementsKeys {
        static get mark() { return 's'; }
        static get delete() { return 'd'; }
        static get copy() { return 'c'; }
        static get write() { return 'p'; }
    }

    const keydownListener = (e, toolElements) => {
        // 如果不是keyUp事件则跳过
        if (e.type !== 'keydown') {
            log("不是keyup事件，跳过,key:" + e.type);
            return;
        }
        const removeMarkElementExists = toolElements.removeMarkElement ? true : false;
        log("Remove mark element exists: " + removeMarkElementExists + ", key:" + e.key);

        if (e.key === ToolElementsKeys.mark && toolElements.toolMarkElement) {
            if (removeMarkElementExists) {
                toolElements.removeMarkElement.click();
                log("Remove mark tool clicked");
            } else {
                toolElements.toolMarkElement.click();
                log("Mark tool clicked");
            }
            e.preventDefault();

        } else if (e.key === ToolElementsKeys.delete && removeMarkElementExists) {
            toolElements.removeMarkElement.click();
            log("Remove mark tool clicked");
            e.preventDefault();
        } else if (e.key === ToolElementsKeys.copy && toolElements.copyMarkElement) {
            toolElements.copyMarkElement.click();
            log("Copy mark tool clicked");
            e.preventDefault();
        } else if (e.key === ToolElementsKeys.write && toolElements.writeElement) {
            toolElements.writeElement.click();
            log("Write tool clicked");
            e.preventDefault();
        }
    };

    const modifyTitleContent = function (toolElements) {
        if (!toolElements.exist) {
            log("工具栏元素不存在，不修改标题");
            return;
        }
        // log("工具栏元素存在，开始修改标题");
        const removeMarkElementExists = toolElements.removeMarkElement ? true : false;
        log("Remove mark element exists: " + removeMarkElementExists);



        const titleElement = toolElements.toolMarkElement.querySelector('.toolbarItem_text');
        if (titleElement && !titleElement.textContent.includes(ToolElementsKeys.mark)) {
            titleElement.textContent = titleElement.textContent + "(" + ToolElementsKeys.mark + ")";
        }
        const removeMarkElement = toolElements.removeMarkElement?.querySelector('.toolbarItem_text');
        if (removeMarkElement && !removeMarkElement.textContent.includes(ToolElementsKeys.delete)) {
            removeMarkElement.textContent = removeMarkElement.textContent + "(" + ToolElementsKeys.delete + ")";
        }

        const copyMarkElement = toolElements.copyMarkElement.querySelector('.toolbarItem_text');
        if (copyMarkElement && !copyMarkElement.textContent.includes(ToolElementsKeys.copy)) {
            copyMarkElement.textContent = copyMarkElement.textContent + "(" + ToolElementsKeys.copy + ")";
        }

        const writeElement = toolElements.writeElement.querySelector('.toolbarItem_text');
        if (writeElement && !writeElement.textContent.includes(ToolElementsKeys.write)) {
            writeElement.textContent = writeElement.textContent + "(" + ToolElementsKeys.write + ")";
        }
    };

    const autoMark = function () {
        const toolMarkElement = document.evaluate(toolMarkXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        setTimeout(() => {
            const removeMarkElement = document.evaluate(removeMakrXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (toolMarkElement && !removeMarkElement) {
                toolMarkElement.click();
            } else if (removeMarkElement) {
                log("已经划线了")
            } else {
                log("划线失败")
            }
        }, 500);
        log("划线")
    };

    const tryAppendSettingButton = function () {
        // 获取settingTemplateXpath元素
        const settingTemplateElement = document.evaluate(settingTemplateXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (settingTemplateElement) {
            const existingSettingIcon = document.getElementById('weread_ext');
            if (!existingSettingIcon) {
                // 创建Setting按钮
                const settingButton = document.createElement('button');
                settingButton.innerHTML = '设置';
                settingButton.style.cssText = `
                    padding: 8px 16px;
                    margin: 8px 0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: #fff;
                    color: #333;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                settingButton.addEventListener('mouseover', () => {
                    settingButton.style.background = '#f5f5f5';
                });
                settingButton.addEventListener('mouseout', () => {
                    settingButton.style.background = '#fff';
                });
                settingButton.addEventListener('click', () => {
                    const currentEnabled = autoHighlightSettings.isEnabled();
                    log(`点击设置按钮，当前状态: ${currentEnabled ? '已开启' : '已关闭'}`);
                    const title = currentEnabled ? '❌ 关闭自动划线模式?' : '✅ 开启自动划线模式?';
                    const desc = currentEnabled ? '✅ 已开启' : '❌ 已关闭';
                    const confirmed = confirm(`${title}\n\n当前状态: ${desc}`);
                    if (confirmed) {
                        const newEnabled = autoHighlightSettings.toggle();
                        log(newEnabled ? '开启自动划线模式' : '关闭自动划线模式');
                    } else {
                        log('取消切换自动划线模式');
                    }
                });

                // 设置Setting按钮的icon
                const settingIcon = document.createElement('i');
                settingIcon.id = 'weread_ext';
                settingIcon.className = 'setting-icon'; // Add appropriate class for the icon
                settingButton.appendChild(settingIcon);

                // 将Setting按钮插入到settingTemplateElement的后面
                settingTemplateElement.parentNode.insertBefore(settingButton, settingTemplateElement.nextSibling);
            }
        } else {
            // log("settingTemplateXpath element not found");
        }
    }
    let toolElementExit = false;

    const observer = new MutationObserver((mutations) => {
        const toolElements = new ToolElements();
        const originToolElementExit = toolElementExit;
        toolElementExit = toolElements.exist;
        // log("检查工具栏元素:", toolElements.exist ? "存在" : "不存在", "originToolElementExit:", originToolElementExit, "toolElementExit:", toolElementExit);

        function handleKeyDown(toolElements) {
            return function (e) {
                keydownListener(e, toolElements);
            };
        }
        const _handleKeyDown = handleKeyDown(toolElements);

        if (toolElements.exist) {
            if (!originToolElementExit && toolElementExit) {
                modifyTitleContent(toolElements);
                /* 快捷键相关 */
                document.addEventListener('keydown', _handleKeyDown);


                /* 自动划线 */
                const currentEnabled = autoHighlightSettings.isEnabled();
                if (currentEnabled) {
                    autoMark();
                }
            } else {
                log("工具栏元素已存在，不执行逻辑: " + toolElementExit + ",origin: " + originToolElementExit);
            }

        } else {
            document.removeEventListener('keydown', _handleKeyDown);
            // log("Tool element not found at xpath:", toolXpath);
        }

        /* 设置界面 */
        tryAppendSettingButton();
    });


    // 配置观察选项
    const config = {
        childList: true,
        subtree: true
    };

    window.onload = function () {
        // 开始观察文档变化
        observer.observe(document.body, config);
        log("weread_auto_highlight begin init")
    };
    return;


})();
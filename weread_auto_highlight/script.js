// ==UserScript==
// ==/UserScript==

(function () {
    'use strict';
    const log = (...args) => console.log("weread-ch:", ...args);
    log("weread_auto_highlight begin init")
    const toolXpath = '//*[@id="routerView"]/div/div[1]/div[2]/div/div/div[2]/div[12]/div[2]/div/button[2]';
    const toolMarkXpath = '//*[@id="routerView"]/div/div[1]/div[2]/div/div/div[2]/div[12]/div[2]/div/button[2]';
    const removeMakrXpath = '//*[@id="routerView"]/div/div[1]/div[2]/div/div/div[2]/div[12]/div[2]/div/button[5]';
    const copyMarkXpath = '//*[@id="routerView"]/div/div[1]/div[2]/div/div/div[2]/div[12]/div[2]/div/button[1]';
    const writeXpath = '//*[@id="routerView"]/div/div[1]/div[2]/div/div/div[2]/div[12]/div[2]/div/button[6]';
    let toolElementExit = false;

    // 创建一个  ToolElements 实例
    class ToolElements {
        constructor() {
            // tools 元素是否存在
            this.exist = document.evaluate(toolXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null;
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

        } else if (e.key === ToolElementsKeys.delete && removeMarkElementExists) {
            toolElements.removeMarkElement.click();
            log("Remove mark tool clicked");
        } else if (e.key === ToolElementsKeys.copy && toolElements.copyMarkElement) {
            toolElements.copyMarkElement.click();
            log("Copy mark tool clicked");
        } else if (e.key === ToolElementsKeys.write && toolElements.writeElement) {
            toolElements.writeElement.click();
            log("Write tool clicked");
            e.preventDefault();
        }
    };

    const modifyTitleContent = function (toolElements) {
        const titleElement = toolElements.toolMarkElement.querySelector('.toolbarItem_text');
        if (titleElement && !titleElement.textContent.includes(ToolElementsKeys.mark)) {
            titleElement.textContent = titleElement.textContent + "(" + ToolElementsKeys.mark + ")";
        }
        const removeMarkElement = toolElements.removeMarkElement.querySelector('.toolbarItem_text');
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

    const onToolElementShow = function () {
        const toolMarkElement = document.evaluate(toolMarkXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const removeMarkElement = document.evaluate(removeMakrXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (toolMarkElement && !removeMarkElement) {
            toolMarkElement.click();
            log("划线")
        } else if (removeMarkElement) {
            log("已经划线了")
        } else {
            log("划线失败")
        }
    };
    const observer = new MutationObserver((mutations) => {
        const toolElements = new ToolElements();


        function handleKeyDown(toolElements) {
            return function (e) {
                keydownListener(e, toolElements);
            };
        }
        const _handleKeyDown = handleKeyDown(toolElements);
        if (toolElements.exist && !toolElementExit) {
            log("Found tool element at xpath:", toolXpath);
            /* 快捷键相关 */
            document.addEventListener('keydown', _handleKeyDown);
            modifyTitleContent(toolElements);

            /* 自动划线 */
            onToolElementShow();

        } else {
            document.removeEventListener('keydown', _handleKeyDown);
        }
        toolElementExit = toolElements.exist;
    });


    // 配置观察选项
    const config = {
        childList: true,
        subtree: true
    };

    // 开始观察文档变化
    observer.observe(document.body, config);
    return;


})();
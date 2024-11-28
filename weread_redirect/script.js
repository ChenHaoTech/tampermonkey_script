// ==/UserScript==
// ==/UserScript==

(function () {
    'use strict';
    window.onload = function() {
        const openButton = document.querySelector('.weui-btn.weui-btn_default');
        if (openButton) {
            openButton.click();
        }
    };
})();
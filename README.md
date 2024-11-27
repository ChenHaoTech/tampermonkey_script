## 如何使用本地文件
[常问问题 | Tampermonkey](https://www.tampermonkey.net/faq.php#Q402)

Chrome（和衍生用户）可以导出并@require本地副本
打开 Tampermonkey 的仪表板，打开脚本并复制其内容。
创建本地文件并粘贴内容
删除 Tampermonkey 内脚本中除“UserScript”标头之外的所有内容
添加@require标记，其中包含要包含在脚本中的本地文件的路径。例如，如果文件位于 C:\Users\[USERNAME]\Documents\myscript.js ，您可以将以下行添加到脚本中：
// @require       file://C:/Users/[USERNAME]/Documents/myscript.js
Finally enable local file access.
最后启用本地文件访问。

## 外部资源如何引用
[[油猴脚本开发指南]外部资源引用_油猴脚本token-CSDN博客](https://blog.csdn.net/lihengdao666/article/details/113355118)
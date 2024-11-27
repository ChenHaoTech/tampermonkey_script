## 如何使用本地文件
[常问问题 | Tampermonkey](https://www.tampermonkey.net/faq.php#Q402)

Chrome (and derivates users) can export and @require the local copy
Chrome（和衍生用户）可以导出并@require本地副本
Open Tampermonkey's dashboard, open the script and copy its content.
打开 Tampermonkey 的仪表板，打开脚本并复制其内容。
Create a local file and paste the content
创建本地文件并粘贴内容
Remove all content from the script inside Tampermonkey except the "UserScript" header
删除 Tampermonkey 内脚本中除“UserScript”标头之外的所有内容
Add a @require tag with the path to the local file that you want to include in the script. For example, if the file is located at C:\Users\[USERNAME]\Documents\myscript.js, you would add the following line to the script:
添加@require标记，其中包含要包含在脚本中的本地文件的路径。例如，如果文件位于 C:\Users\[USERNAME]\Documents\myscript.js ，您可以将以下行添加到脚本中：
// @require       file://C:/Users/[USERNAME]/Documents/myscript.js
Finally enable local file access.
最后启用本地文件访问。
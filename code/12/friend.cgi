#!D:/Program Files/Python/python.exe
import cgi
reshtml="""Content-Type:text/html\n\n
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>朋友CGI</title>
</head>
<body>
<div>
<h3>从朋友的多少可以测出你以后的命运:<I>你侧过吗？</I></h3>
你输入的名字是：<B>%s</B><br/><br/>
你选择的朋友是：你知道吗？我有<B>%s</B>个朋友
</div>
</body>
</html>
"""
form=cgi.FieldStorage()
who=form['person'].value
howmany=form['howmany'].value
print reshtml%(who,howmany)

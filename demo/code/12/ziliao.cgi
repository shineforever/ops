#!D:/Program Files/Python/python.exe
import cgi
reshtml="""Content-Type:text/html\n\n
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>个人小资料</title>
</head>
<body background="img/http_imgload12.jpg">
<div>
<h3>偶滴小资料</h3>
你的名字是：<B>%s</B><br/><br/>
你的生日是：<B>%s</B><br/><br/>
你的爱好是：<B>%s</B><br/><br/>
你喜欢的颜色是：<B>%s</B><br/><br/>
你喜欢的节日是：<B>%s</B><br/><br/>

你最伤心的事是：<B>%s</B><br/><br/>
你的心情与谁分享是：<B>%s</B><br/><br/>
你喜欢的生活方式是：<B>%s</B><br/><br/>
</div>
</body>
</html>
"""
form=cgi.FieldStorage()
name=form['name'].value
birthday=form['birthday'].value
aihao=form['aihao'].value
yanse=form['yanse'].value
jieri=form['jieri'].value
shenghuo=form['shenghuo'].value
shangxin=form['shangxin'].value
xinqing=form['xinqing'].value
print reshtml%(name,birthday,aihao,yanse,jieri,shangxin,xinqing,shenghuo)

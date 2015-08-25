#!D:/Program Files/Python/python.exe
import cgi
header="Content-Type:text/html\n\n"         #将HTTP MIME头从HTML正文中提取


#出错的页面
errorHtml="""
<html>
<head>
<title>朋友CGI</title>
</head>
<body class="bg">
<H3>不好意思！出错了！！</H3>
<B>%s</B>
<form>
  <input type="button" value=" 返 回 " onclick="window.history.back()" />
</form>
</body>
</html>
"""

#负责显示错误页面的函数
def showError(error_str):
    print header+errorHtml %(error_str)


#声明表单页面
url="/cgi-bin/friendWeb.cgi"
formhtml="""
<html>
<head>
<title>朋友CGI</title>
</head>
<body class="bg">
<div class="bground">
  <h3>从朋友的多少可以测出你以后的命运:<I>你侧过吗？</I></h3>
  <form action="%s">
    <B>输入您的名字:</B>
    <input name="action" type="hidden" value="edit" />
    <input name="person" value="" size="15"/>
    <p><B>你有多少个朋友？</B></p>
    %s
     <p align="center">
      <input  type="submit" value=" 测 试 "/>
    </p>   
  </form>
</div>
</body>
</html>
"""
#声明一个单选按钮的变量
radio="<input  type=radio name=howmany value='%s' %s />%s\n"

#负责用户输入生成表单页的函数
def showForm(who,howmany):
    friends=""
    for i in [0,10,25,50,100]:
        checked=""
        if str(i)==howmany:
            checked="checked"
        friends=friends+radio %(str(i),checked,str(i))
    print header+formhtml %(url,friends)        #为数据表单页添加MIME头信息

#生成的结果页面
reshtml="""
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>朋友CGI</title>
</head>
<body>
<div>
  <h3>从朋友的多少可以测出你以后的命运:<I>你侧过吗？</I></h3>
  你输入的名字是：<B>%s</B><br/>
  <br/>
  你选择的朋友是：你知道吗？我有<B>%s</B>个朋友 </div>
  <p><a href='%s'>单击这里</a>返回到开始页面</p>
</body>
</html>
"""

#负责生成结果页的函数
def doResults(who,howmany):
    newurl=url+'?action=reedit&person=%s&howmany=%s'%(who,howmany)
    print header+reshtml % (who,howmany,newurl)        #为结果页面添加MIME头信息

#具体执行某一步的操作
def process():
    error=''
    form=cgi.FieldStorage()
    if form.has_key('person'):
       who=form['person'].value
    else:
        who='NULLUSER'
    if form.has_key('howmany'):
        howmany=form['howmany'].value
    else:
        if form.has_key('action')and form['action'].value=='edit':
            #doResults(who,howmany)
            error='请选择您有几个好朋友'
        else:
            howmany=0
    if not error:
        if form.has_key('action') and form['action'].value!='reedit':
            doResults(who,howmany)
        else:
            showForm(who,howmany)
    else:
        showError(error)
if __name__=='__main__':
    process()

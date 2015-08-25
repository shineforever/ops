#!D:/Program Files/Python/python.exe
reshtml="""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>朋友CGI</title>
<style>
.bg{
	background-image:url(/img/http_imgload12.jpg);
	background-repeat:no-repeat;
	width:600px;
	height:450px;	
}
.bground{
	padding-left:90px;
	padding-top:40px;}
body,td,th {
	font-size: 16px;
}
</style>
</head>
<body class="bg">

<div class="bground">
<h3>从朋友的多少可以测出你以后的命运:<I>你侧过吗？</I></h3>
<form action="friend.py">
<B>输入您的名字:</B>
<input name="person" value="" size="15"/>
<p><B>你有多少个朋友？</B></p>
<input  type="radio" name="howmany" value="0" checked="checked"/>我很宅，没有朋友<br /><br />
<input  type="radio" name="howmany" value="10" />我不擅长交际，我只有10个朋友，但都是知心的哦<br /><br />
<input  type="radio" name="howmany" value="23" />自认为不错吧，有23个朋友
<br /><br />
<input  type="radio" name="howmany" value="50" />我很好哦，我至少有50多个朋友
<br /><br />
<input  type="radio" name="howmany" value="100" />我人缘特好，我至少有100个朋友，以诚相待的那种
<p align="center"><input  type="submit" value=" 测 试 "/></p>

</form>
</div>
</body>
</html>
"""
print reshtml

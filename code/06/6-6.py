#-*-coding:UTF-8 -*-
#Python模板
print "=========Welcome to the itzcn=========\n窗内网>>会员注册";
username=raw_input("请输入用户登录：");
userpwd1=raw_input("请输入密码：");
userpwd2=raw_input("请输入确认密码：");
mail=raw_input("请输入126邮箱地址：");
print "正在验证中,请稍等......";
if mail.rfind("@")>18 or mail.rfind("@")<6:
	print "您输入邮箱地址不合法,请重新输入邮箱地址";
	mail=raw_input("请输入126邮箱地址：");
else:
	print "验证通过,正在注册中.....";
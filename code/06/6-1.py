#-*-coding:UTF-8 -*-
#Python模板
print "【欢迎大家使用窗内网邮箱系统！】\n===========窗内xxx@itzcn.com邮箱注册===========";
loginname=raw_input("请输入您要注册的用户名：");#获取用户帐号
loginpwd=raw_input("请输入您的登录密码");#获取用户密码
name=raw_input("请输入您的真是姓名");#获取用户姓名
yzm=int(raw_input("请输入验证码：3+3=？"));#获取用户输入验证码
if yzm==6:#判断用户输入验证码是否正确
	print "正在注册中，请稍后........"
	print "===========恭喜您注册成功了！===========\n",name+"：您好！","\n您的邮箱地址为",loginname+"@itzcn.com\n您的密码为：",loginpwd+"\n请保管好您的用户信息，进行登录！";#显示用户注册信息
else:
	print "验证码错误！"
	yzm=int(raw_input("请输入验证码：3+3=？"));#验证码错误重新输入
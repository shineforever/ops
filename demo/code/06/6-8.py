#-*-coding:UTF-8 -*-
#Python模板
import re;
print "==================欢迎使用窗内网会员注册系统==================";
name = raw_input("请输入用户名：\n");
pwds1= raw_input("请输入登录密码：\n");
pwds2= raw_input("请确认密码：\n");
text = raw_input("请输入邮箱地址：\n");
m = re.match(r"^([a-z0-9A-Z]+[-|\\.]?)+[a-z0-9A-Z]@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\.)+[a-zA-Z]{2,}$", text);
if m: 
	print name,"您好！您的帐号已经注册成功！\n您的邮箱地址为：",text+"\n请保管好您的帐号信息！";
else: 
	print '邮箱格式不正确，请重新输入邮箱地址！';
	text = raw_input("请输入邮箱地址：\n");
	m = re.match(r"^([a-z0-9A-Z]+[-|\\.]?)+[a-z0-9A-Z]@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\.)+[a-zA-Z]{2,}$", text);
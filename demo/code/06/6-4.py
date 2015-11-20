#-*-coding:UTF-8 -*-
#Python模板
print "欢迎使用邮箱快速登陆了系统";
mail=raw_input("请输入您的126邮箱地址：");
username=mail.strip("@126.com");
password=raw_input("请输入您的登录密码：");
print username,"您好，欢迎登录126邮箱！";
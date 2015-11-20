#-*-coding:UTF-8 -*-
#Python模板
print "欢迎使用XX银行自动取款机！";
car=raw_input("请输入您的卡号：");
pwds=raw_input("请输入您的密码：");
print "登录成功！进行取款业务。";
name=raw_input("请输入您的用户名：");
money=int(raw_input("请输入交易金额："));
print "正在交易中，请稍后......\n交易成功，请查收您的客户凭条！";
print "【XX银行自动取款机客户凭条】\n===========================";
print "%s您好！\n您的卡号%s\n本次交易金额为%f\n欢迎下使用！"%(name,car,money);
print "===========================";

#-*-coding:UTF-8 -*-
#Python模板
print "==========欢迎使用窗内网记事本==========";
con=True
while con:
	k=int(raw_input("请输入您的操作\n1.【我要写日记】\n2.【查看往事】\n3.【退出】\n"));
	if (k==1):
		o=open("d:\itzcn\mylog.log","a+");
		content=raw_input("请输入您需要记录的事情：\n");
		o.write(content);
		o.close();
		print "==============================";
	elif (k==2):
		print "日志内容：";
		o=open("d:\itzcn\mylog.log");
		listcontent=o.readlines();
		for content in listcontent:
			 print content;
		o.close();
		print "==============================";
	else:
		print "欢迎下次使用！";
		con=False;
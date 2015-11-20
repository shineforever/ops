#-*-coding:UTF-8 -*-
#Python模板
import os;
print "==========欢迎使用窗内网记事本==========";
con=True
while con:
	k=int(raw_input("请输入您的操作\n1.【我要写日记】\n2.【查看往事】\n3.【记事本格式化】\n4.【退出】\n"));
	if (k==1):
		o=open("d:\itzcn\mylog.log","a+");
		content=raw_input("请输入您需要记录的事情：\n");
		o.write(content);
		o.close();
		print "==============================";
	elif (k==2):
		print "日志内容：\n";
		o=open("d:\itzcn\mylog.log","a+");
		listcontent=o.readlines();
		for content in listcontent:
			 print content;
		o.close();
		print "==============================";
	elif (k==3):
		gsh=int(raw_input("您确定要格式化记事本吗?格式化后数据将会全部消失\n确定输入1，取消输入2：\n"));
		if (gsh==1):
			print "记事本正在格式化中......";
			if os.path.exists("d:\itzcn\mylog.log"):
				os.remove("d:\itzcn\mylog.log");
				print "记事本格式化成功！";
				open("d:\itzcn\mylog.log","a+");
			else:
				print "记事本不存在！";
	else:
		print "欢迎下次使用！";
		con=False;

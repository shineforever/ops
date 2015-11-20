#-*-coding:UTF-8 -*-
#Python模板
import shutil;
import os;
import re;
import time;
print "==========欢迎使用窗内网记事本==========";
con=True
while con:
	print "==============================";
	k=int(raw_input("请输入您的操作\n1.【我要写日记】\n2.【查看往事】\n3.【记事本格式化】\n4.【备份记事本】\n5.【记事本恢复】\n6.【查看日记分类】\n7.【退出】\n"));
	if (k==1):
		times="d:\\itzcn\\"+time.strftime("%Y-%m-%d",time.localtime());
		if os.path.exists(times)==False:
			os.makedirs(times);
		files=times+"\mylog.log";
		o=open(files,"a+");
		content=raw_input("请输入您需要记录的事情：\n");
		count=0;
		for s in o.readlines():
			li=re.findall("窗内网",s);
			if len(li)>0:
				count=count+li.count("窗内网");
		th=int(raw_input("查找到"+str(count)+"个可能替换的内容是否继续？\n确定输入1，取消输入2：\n"));
		if th==1:
			content=content.replace("窗内网","窗内网（http://www.itzcn.com）");
		o.write(content);
		o.close();
	elif (k==2):
		fls=raw_input("请输入记事本分类名称：\n")
		if os.path.exists("d:\itzcn\\"+fls+"\mylog.log"):
			print "日志内容：\n";
			o=open("d:\itzcn\\"+fls+"\mylog.log","a+");
			listcontent=o.readlines();
			for content in listcontent:
				 print content;
			o.close();
		else:
			print "分类名称不存在！";
	elif (k==3):
		gsh=int(raw_input("您确定要格式化记事本吗?格式化后数据将会全部消失\n确定输入1，取消输入2：\n"));
		if (gsh==1):
			fls=raw_input("请输入格式化记事本分类名称：\n")
			print "记事本正在格式化中......";
			if os.path.exists("d:\itzcn\\"+fls+"\mylog.log"):
				os.remove("d:\itzcn\\"+fls+"\mylog.log");
				print "记事本格式化成功！";
				open("d:\itzcn\\"+fls+"\mylog.log","a+");
			else:
				print "记事本不存在！";
	elif (k==4):
		bf=int(raw_input("您确定要备份记事本吗?\n确定输入1，取消输入2：\n"));
		if (bf==1):
			fls=raw_input("请输入备份记事本分类名称：\n")
			print "记事本正在备份中......";
			if os.path.exists("d:\itzcn\\"+fls+"\mylog.log"):
				os.makedirs("d:\\itzcn\\"+fls+"\\bf")
				shutil.copyfile("d:\itzcn\\"+fls+"\\mylog.log","d:\\itzcn\\"+fls+"\\bf_mylog.log");
				shutil.move("d:\\itzcn\\"+fls+"\\bf_mylog.log","d:\\itzcn\\"+fls+"\\bf\\bf_mylog.log");
				print "备份成功";
			else:
				print "备份记事本分类不存在！";
	elif (k==5):
		hf=int(raw_input("您确定要恢复记事本吗?\n确定输入1，取消输入2：\n"));
		if (hf==1):
			fls=raw_input("请输入恢复记事本分类名称：\n")
			if os.path.exists("d:\itzcn\\"+fls+"\mylog.log"):
				print "记事本正在恢复中......";
				shutil.copyfile("d:\\itzcn\\"+fls+"\\bf\\bf_mylog.log","d:\\itzcn\\"+fls+"\\mylog.log");
			else:
				print "恢复记事本类型不存在！";
	elif (k==6):
		print "日记分类信息：";
		def ListDir (path,fun,par):
			for filespath in par:
				print os.path.join(fun,filespath);
		if __name__=="__main__":
			os.path.walk("d:\itzcn",ListDir,());
	else:
		print "欢迎下次使用！";
		con=False;
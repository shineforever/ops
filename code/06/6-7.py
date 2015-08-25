#-*-coding:UTF-8 -*-
#Python模板
print "=========欢迎使用窗内网留言系统=========\n窗内网>>留言板";
title=raw_input("请输入留言标题：");
content=raw_input("请输入留言内容：");
newtitle=title.replace("过滤器","***");
newtitle=newtitle.replace("后台管理密码","***");
newcontent=content.replace("过滤器","***");
newcontent=newcontent.replace("坏蛋","***");
print "您的留言内容为：";
print "标题：",newtitle;
print "内容：\n%s"%newcontent;

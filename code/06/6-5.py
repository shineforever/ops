#-*-coding:UTF-8 -*-
#Python模板
print "========欢迎使用图片上传系统========";
filename=raw_input("请输入需要上传的图片路径地址:");
if filename.endswith(".gif") or filename.endswith(".jpg"):
	print "%s图片格式正确，正在上传中....."%filename;
else:
	print "图片格式不正确，请上传GIF或者JPG格式图片";

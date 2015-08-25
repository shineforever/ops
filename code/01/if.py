a = int(raw_input("请输入您想要输入的数字："))
if a > 0:
    print "您输入的数是一个正数"
else:
    print "您输入的数是一个负数"
    
b = input("我们来一起判断正负，请输入一个数字：")
if b > 0:
    print "您输入的数是一个正数"
elif b < 0:
    print "您输入的数是一个负数"
else:
    print "您输入的数是0"
s = raw_input("尊敬的用户，请输入您的名字：");
if s.endswith("wang"):
    if s.startswith("yabin"):
        print "你好，wangyabin"
    elif s.startswith("jing"):
        print "您好，wangjing"
else:
    print "请您输入正确的名字，谢谢"

import mySecondModule
num=mySecondModule.myFun()
print "调用模块函数，num="+str(num)

mySecondModule.num = 10
num=mySecondModule.num
print "改变模块局部变量num的值，此时num="+str(num)
senum=mySecondModule.myFun()
print "当num的值为10时，调用模块函数，num="+str(senum)
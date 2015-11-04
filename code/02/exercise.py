#coding=utf-8
var1=int(raw_input('第一个参数'))
var2=int(raw_input('第二个参数'))
var=raw_input('运算符')
if(var=='+'):
	var3=var1+var2
	print var3
elif(var=='-'):
        var3=var1-var2
        print var3
elif(var=='*'):
        var3=var1*var2
        print var3
else:
        var3=var1/var2
        print var3


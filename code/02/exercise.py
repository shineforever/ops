var1=int(raw_input('请输入操作数1：'))
var2=int(raw_input('请输入操作数2：'))
var=raw_input('请输入算术运算符：')
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


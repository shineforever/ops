# 调用自定义模块的类和函数
import myFirstModule
import  max

myFirstModule.myFun1()
myFirstModule.myFun2()
myclass= myFirstModule.MyClass()
myclass.myClassFun()

a=raw_input('请输入第一个参数')
b=raw_input('请输入第二个参数')
max.max(a,b)
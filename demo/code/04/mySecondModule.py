# 定义mySecondModule模块，每次调用myFun()函数，全局变量num子增1
num = 5
def myFun ():
    global num
    num = num + 1
    return num


print myFun()
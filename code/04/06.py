# 定义含有返回值的函数
def login (username,password):
    msg=''
    if(username == 'admin') and (password == 'admin'):
        msg="登录成功！"
    else:
        msg='登录失败！'
    return msg
print login('admin' , 'admin')
    
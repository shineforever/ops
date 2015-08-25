# 函数的定义
def login (username = "maxianglin" , password = "maxianglin"):
    if(username == 'admin') and (password == 'admin'):
        print "登录成功！"
    else:
        print "登录失败"
login('admin','admin')
login('admin')
login(password='admin')
login()
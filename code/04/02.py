# 函数的定义
def login (usernames = [] , password = "admin"):
    username = usernames[0]
    if(username == 'admin') and (password == 'admin'):
        print "登录成功！"
    else:
        print "登录失败"
login(['admin','maxianglin'])
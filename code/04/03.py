# 传递可变参数
def login (* userpwds):
    username = userpwds[0]
    password = userpwds[1]
    if(username == 'admin') and (password == 'admin'):
        print "登录成功！"
    else:
        print "登录失败！"
login('admin','admin')
login('maxianglin','maxianglin')
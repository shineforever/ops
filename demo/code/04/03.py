# 传递可变参数
def login (* userpwds):
    username = userpwds[0]
    password = userpwds[1]
    ss = userpwds [2]
    if(username == 'admin') and (password == 'admin'):
        print "登录成功！"
        print  ss
    else:
        print "登录失败！"
login('admin','admin', '12')
login('admin','admin', '111')
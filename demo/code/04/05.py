def login (**userpwds):
    keys=userpwds.keys()
    username=''
    password=''
    for key in keys :
        if 'username'==key: 
            username=userpwds[key]
        if 'password'==key: 
            password=userpwds[key]
    if(username == 'admin') and (password == 'admin'):
        print '登录成功！'
    else:
        print '登录失败！'
    
login(username='admin',password='admin')
    
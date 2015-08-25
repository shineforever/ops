def addUser (usernames = [] , realname='无名', addres = '河南省郑州市'):
    username = usernames[0]
    if username == 'admin':
        print "添加成功！"
    else:
        print "添加失败！"
addUser(['admin','maxianglin','yangxiaona'])
        

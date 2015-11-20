db={}   #声明一个空的字典
# 如果是新用户，则需要注册
def newuser ():
    prompt='请输入注册账号：'
    while True:
        name=raw_input(prompt)
        # 检测字典中是否已经存在键为用户注册账号的元素
        if db.has_key(name):
            prompt='您注册的账号已经存在，请使用其它账号注册：'
            continue
        else:
            password=raw_input('请输入注册密码：')
            # 将用户注册的账号和密码作为字典的键——值对
            db[name]=password
            break
# 如果已经注册过，则需要登录
def olduser ():
    name=raw_input('请输入登录账号:')
    password=raw_input('请输入登录密码:')
    # 获取注册账号所对应的密码
    userpwd=db.get(name)
    # 判断用户输入的登录密码是否与注册密码相同
    if userpwd == password:
        print '欢迎您登录：',name
    else:
        print '您的用户名或密码错误，请重新登录！'
# 显示系统界面
def showmenu ():
    prompt="请输入用户状态（n：注册 e：登录）："
    con = False
    while not con:
        chosen = False
        while not chosen:
            try:
                # 将用户输入的字母小写格式化
                choice=raw_input(prompt).strip()[0].lower()
            except(EOFError,KeyboardInterrupt):
                choice='q'
            print '您按下了【%s】键'% choice
            if choice not in 'neq':
                print '您输入的内容不合法，请重新输入：'
            else:
                chosen = True
                con = True
        if choice == 'n':
            newuser()
        elif choice == 'e':
            olduser()
        else:
            showmenu()
        showmenu()

showmenu()            
        
            

           
            
    
    
    
        
        
        
    

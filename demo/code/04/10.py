def login (username , password):
    msg = ''
    if(username == 'admin') and (password == 'admin'):
        msg = '登录成功'
    else:
        msg = '登录失败'
    return msg
print apply(login,('admin','admin'))

    
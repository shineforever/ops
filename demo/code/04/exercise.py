def register (username , password , realname , sex = '男' , addres = '无固定住所' ):
    if(len(username)<6) or (len(username)>12):
        print '输入的用户名长度只能在4-12之间，请重新输入'
        inputRegist()
    elif(len(password)<8) or (len(password)>20):
        print '输入的密码长度只能在8-20之间，请重新输入'
        inputRegist()
    elif(realname=='') or (realname == None):
        print '真实姓名不能为空，请重新输入'
        inputRegist()
    else:
        print '注册成功！'
def inputRegist ():
    username=raw_input('请输入用户名：')
    password=raw_input('输入密码：')
    realname=raw_input('请输入真实姓名：')
    sex=raw_input('请输入性别：')
    addres=raw_input('请输入居住地址：')
    register(username,password,realname,sex,addres)
inputRegist()

    

    

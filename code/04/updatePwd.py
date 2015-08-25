# -*- coding: UTF-8 -*- 
def updatePassword():
    message=""
    oldPwd=raw_input(u"请输入原始密码：")
    if(oldPwd != "python"):
        message="原始密码输入错误，请重新输入！"
    else:
        newPwd=raw_input(u"请输入新密码：")
        if(len(newPwd)>6) and (len(newPwd)<18):
            renewPwd=raw_input(u"请输入确认密码：")
            if(renewPwd!=newPwd):
                message="两次输入的密码不一致，修改失败！"
            else:
                message="恭喜您！密码修改成功！"
        else:
            message="密码长度必须在6-18位之间"
    return message

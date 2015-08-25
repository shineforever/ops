import myindexerror
import myvalueerror
userList=['maxianglin','wanglili','malingling','fanxiaoxuan']
user_str=''
user_name=''
input_selectIndex=0
user_name=0
try:
    input_selectIndex=int(raw_input('请输入要查询的用户名编号：'))
    user_str=userList[input_selectIndex]
    input_selectName=raw_input('请输入要查询的用户名：')
    user_name=userList.index(input_selectName)
except IndexError,e:
    print '出现的错误信息编号为：',myindexerror.MyIndexError('1').value
except ValueError,e:
    print '出现的错误信息编号为：',myvalueerror.MyValueError('2').value
else:
    print '您输入的编号为'+str(input_selectIndex)+'的用户为：'+user_str
    print '您输入的用户名'+input_selectName+'在列表中对应的索引为：'+str(user_name)




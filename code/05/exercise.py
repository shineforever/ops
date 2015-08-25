people={
    'maxianglin':{
        'phone':'13587845896',
        'addr':'北京市海淀区'
    },
    'wanglili':{
        'phone':'13658475896',
        'addr':'河南省安阳市'
    },
    'malingling':{
        'phone':'15784785842',
        'addr':'河南省郑州市'
    }
}
labels={
    'phone':'电话号码',
    'addr':'家庭住址'
}
name=raw_input('请输入用户名:')
request=raw_input('要查询该用户的联系电话还是家庭地址？（p：联系电话  a：家庭住址）')
if request == 'p':
    key='phone'
if request == 'a':
    key='addr'
if name in people:
    print '您要查找的%s的%s是%s！'% (name,labels[key],people[name][key])
else:
    print '您输入的用户名错误，请重新输入！'
 


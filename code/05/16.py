userList = ['0001' , '0002' , '0003' , '0004']
userList.append('0005')
print '列表顺序为：'
for item in range(len(userList)):
    print userList[item]
print '取出顺序为：'   
for item in range(len(userList)) :
    print userList.pop()
    
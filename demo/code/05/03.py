userList = ['0001' , '0002' , '0003' , '0004' , '0005']
print '目前有学生'+str(len(userList))+'个'
userList.insert(2,'0006')
print '现有学生'+str(len(userList))+'个，他们是：'
for item in userList:
    print item
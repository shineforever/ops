userList = ['0001' , '0002' , '0003' , '0004' , '0005']
print '目前有学生'+str(len(userList))+'个'
print '刚来一个学生'
userList.append('0006')
print '现有学生'+str(len(userList))+'个，他们是：'
for item in userList:
    print item
    

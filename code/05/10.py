userList1=['0001' , '0002' , '0003' , '0004']
userList2=['0005' , '0006' , '0007']
userList=[userList1 , userList2]
#print userList
#print "userList[0][1]=",userList[0][1]
#print "userList[1][0]=",userList[1][0]
#print "userList[0][3]=",userList[0][3]
for i in range(len(userList)) :
    for j in range(len(userList[i])) :
        print 'userList['+str(i)+']['+str(j)+']=',userList[i][j]
    
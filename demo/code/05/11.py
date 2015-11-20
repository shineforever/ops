userList1=['0001' , '0002' , '0003' , '0004']
userList2=['0005' , '0006' , '0007']
userList1.extend(userList2)
print userList1

userList3=['0008' , '0009' , '0010']
userList4=['0011' , '0012' , '0013']
userList5=userList3+userList4
print userList5

userList5 += ['0014']
print userList5

userList6= ['0015' , '0016']*2
print userList6
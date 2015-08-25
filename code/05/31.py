userDic={'0001':'maxianglin','0002':'wanglili','0003':'malinlin'}
for (key,value) in userDic.iteritems():
    print 'userDic[%s]='% key,value
for key in userDic.iterkeys():
    print key
for value in userDic.itervalues():
    print value
     
for (key ,value) in zip(userDic.iterkeys(),userDic.itervalues()):
    print 'userDic[%s]='% key,value

    

   
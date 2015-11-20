worldDic={'a':9 , 'world':10 , 'z':8 ,'hello':12}
print sorted(worldDic.items(),key=lambda d:d[0])
print sorted(worldDic.items(),key=lambda d:d[1])
from random import randint
allNums = []
for eachNum in range(10):
    allNums.append(randint(1000,9999))
print '随机从1000-9999生成的数字中获取的10个值为：'+str(allNums)
print '偶数的有：'+str(filter(lambda n:n%2==0, allNums))
print '奇数的有：'+str(filter(lambda n:n%2!=0, allNums))


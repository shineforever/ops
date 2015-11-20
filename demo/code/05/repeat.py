def fruitFun (fruitList):
    checked = ['香蕉','橘子','香梨'] 
    for e in fruitList: 
        if e not in checked: 
            checked.append(e)
    print '-------------欢迎使用水果信息管理系统--------------'
    print '现有水果：'
    checked.sort(reverse=True)
    for item in checked :
        print item
    return checked
fruits = ['苹果','香蕉','橘子','香梨','橙子','苹果','香蕉','橘子']
addFruit = raw_input('请输入你要添加的水果：')
fruits.append(addFruit)
fruitList = fruitFun(fruits)
selectFruit= raw_input('请输入要查找的水果名称：')
print '你要查找的水果名称为【'+selectFruit+'】的水果在列表中的位置为第'+str(fruitList.index(selectFruit)+1)+'个'



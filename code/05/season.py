sprints = ('香蕉','杨桃','番荔枝','草莓','柑橘')
summers=('芒果','黄瓜','番龙眼','西瓜','柠檬')
autumns=('菠萝','木瓜','杨桃','火龙果','人心果')
winters=('番石榴','油梨','橙子','苹果')
seasons_fruits=(sprints,summers,autumns,winters)
seasons=('春季','夏季','秋季','冬季')
select_season = raw_input('请选择旅游季节（春天：1，夏天：2，秋天：3，冬天：4）：')
for sea in range(len(seasons)):
    if select_season == str(sea+1):
        print '你选择的是：',seasons[sea]
        print seasons[sea]+'的水果有：'
for season in range(len(seasons_fruits)) :    
    if select_season == str(season+1):
        for fruit in range(len(seasons_fruits[season])) :
            print seasons_fruits[season][fruit]
            
    

    


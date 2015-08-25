class Animal(object):
    def __init__(self):
        pass
    def Eat(self):
        pass

class Chicken(Animal):
    def __init__(self):
        super(Chicken, self).__init__()
    def Eat(self):
        print '这只火鸡已经被吃了'

class Dog(Animal):
    def __init__(self):
        super(Dog, self).__init__()
    def Eat(self):
        print '这狗肉已经被吃了'

#实现一个调用的方法,这里也用类来实现吧
class Person(object):
    def __init__(self,name):
        self.name = name
        print '我的名字叫：%s'%self.name
    def Feed(self, ped):
        ped.Eat()


if __name__ == '__main__':
    Kobe = Person('Kobe')#给调用者取个名字吧
    pedChicken = Chicken()#建立一个小鸡宠物
    pedDog = Dog()#建立一个小狗宠物
    #Kobe.Feed(pedChicken)#Feed方法根据传入的参数不同调用
    Kobe.Feed(pedDog)

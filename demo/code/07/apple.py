class Fruit:   
    def __init__(self, *args):   
        for arg in args:   
            arg(self)                  
    def config(self, *args):   
        for arg in args:   
            arg(self)
            
#是否成熟            
def has_harvest(self):   
    self.harvest = True         
def has_not_harvest(self):   
    self.harvest = False
    
#水果的颜色       
def setColor(color):   
    def method(self):   
        self.color = color   
    return method

#水果是否能吃
def can_eat(self):   
    self.eat = True
def can_notEat (self):
    self.eat=False 

if __name__=='__main__':
	apple = Fruit(has_not_harvest, setColor('green')) 	
	print '苹果是否成熟:%s;目前苹果的颜色:%s' % (apple.harvest, apple.color)  
	apple.config(has_harvest, setColor('red'),can_notEat)   
	print '苹果是否成熟:%s;目前苹果的颜色:%s;可以摘下来吃吗：%s' % (apple.harvest, apple.color, apple.eat)
	apple.config(has_harvest, setColor('red'), can_eat)   
	print '苹果是否成熟:%s;目前苹果的颜色:%s;可以摘下来吃吗:%s' % (apple.harvest, apple.color, apple.eat) 
 

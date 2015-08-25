def add1(a):   
    return a + 1  
def add2(a, b):   
    return a + b   
def add3(a, b, c):   
    return a + b + c 
    
a1 = [1,2,3,4,5]   
a2 = [1,2,3,4,5]   
a3 = [1,2,3,4,5]   
  
b = map(add1, a1)   
print b   
b = map(add2, a1, a2)   
print b   
b = map(add3, a1, a2, a3) 
print b
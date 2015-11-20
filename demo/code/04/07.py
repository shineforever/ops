def operat (x , y , z):
    x = x + 5
    y = y + 5
    z = z + 5
    oper = [x , y , z]
    numbers = tuple(oper)
    return numbers
x,y,z = operat(1,2,3)
print x,y,z
     
    
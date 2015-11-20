class MyError(Exception):
    value=''
    def __init__ (self,value):
        self.value=value
    def __str__ (self):
        return repr(self.value)

try:
    raise MyError(2*2)
except MyError, e:
    print 'My exception occurred, value:', e.value


        
        
    
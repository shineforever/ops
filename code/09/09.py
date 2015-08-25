import sys
try:
    a=b
    b=c
except:
    info=sys.exc_info()
    print info
    print info[0]
    print info[1]

try:
    s=1/0
except IndexError:
    print 'except'
except KeyError:
    print 'keyerror'
except ZeroDivisionError:
    print 'ZeroDivisionError'


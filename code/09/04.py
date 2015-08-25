try:
    raise NameError
except NameError:
    print '抛出一个异常'

raise ValueError,'invalid argument'


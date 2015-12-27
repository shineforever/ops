def init(**params):
    return "nihao"

def get(**params):
    print 'hello %s' %params.get('name')
    return 'hello %s' %params.get('name')

def create():
    print 'add data'

def update():
    print 'update data'
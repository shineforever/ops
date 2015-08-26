import os
filename = os.environ.get('PYTHONSTARTUP')
if filename and os.path.isfile(filename):
 execfile(filename)
print "这是引入的交互式启动文件"
123213
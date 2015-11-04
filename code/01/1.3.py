# coding=utf-8
import os
#filename = os.environ.get('PYTHONSTARTUP')
filename = os.environ.get('SSH_AUTH_SOCK')

if filename and os.path.isfile(filename):
 execfile(filename)
 print "这是引入的交互式启动文件"
else:
    print filename
    print "这是引入的交互式启动文件"
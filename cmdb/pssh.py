# -*- coding: utf-8 -*-
# author: albert.zhang
# date: 2015-11-02
import requests
import os
import sys
import json
import getopt
from optparse import OptionParser

def usage():
    print 'pssh.py usage:'
    print '-h,—help: print help message'
    print '-o: input pre ,can display pre host'
    print '-p: input prod name'

def send_request(path, method,params={},json={}):
    url = 'http://api.o.vdian.net/' + path

    headers = {}
    headers['Content-type'] = 'application/json'
    headers['Authorization'] = 'Bearer LGh8Izrq8lh7uPDlZv' \
                               '' \
                               'YbLy5Js9fjDf3g'

    return getattr(requests, method)(url, params=params, headers=headers, json=json)


def get_host_by_env(env):
    method = 'get'
    path = 'servers'
#    group_name = raw_input("ＡＰＰ环境：请输入分组名称")
    if env == "":
       group_name = sys.argv[1]
    else :
       group_name = sys.argv[2] 

    if ('pre'  in env ):
       r = send_request(path, method,params={'group': group_name , 'fields':'ip' ,'page': 'false' , 'type':'pre'})
    elif ('prod' in env ):
       r = send_request(path, method,params={'group': group_name , 'fields':'ip' ,'page': 'false' , 'type':'prod'})
    else :
       r = send_request(path, method,params={'group': group_name , 'fields':'ip' ,'page': 'false' , 'type':'prod'})

    re = json.loads(r.content)

    for r in re:

       print r['ip'],
#        sys.stdout.write(r['ip']+" ")
#        sys.stdout.flush()

    return r

def main():
    
    shortargs = 'hp:o:'
    longargs = 'help'
    opts, args = getopt.getopt(sys.argv[1:], shortargs,[longargs])

    for op , value in opts:
        if op == '-o':
            get_host_by_env('prod')
        elif op == '-p':
            get_host_by_env('pre')
        elif op in ('-h','--help'):
            usage()
            sys.exit() 
    if ( '-o' not in sys.argv[1] or '-p' not in sys.argv[1] or '-h' not in sys.srgv[1]):
        get_host_by_env('')
            

if __name__ == "__main__":
    main()
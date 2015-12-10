import sys
import re

def get_upstream():
    file_object = open('hosts.conf')
    try:
        ng_conf = file_object.read()
    finally:
        file_object.close()

    data = ng_conf.split("\n")
    objs = []
    obj = None
    for line in data:
        line = line.strip()
        if ('vmp-server' in line):
            if (obj is not None):
                objs.append(obj)
                obj is None
            obj = {}
            continue

        if (obj is None):
            continue

        kv = line.split(':')

        if (len(kv) is not 2 ):
            break
        a= ''.join(kv[0].split(' ')[1]),
        print a

        for ip in kv[0].split(' ')[1]:
            obj['server'] = ip

            for port in kv[1].split(' ')[0]:
                obj['port'] = port
                # print obj
    if (obj is not None):
        objs.append(obj)
        obj is None

    return objs

print get_upstream()
import commands
import socket

import socket
import fcntl
import struct

import time
import threading, multiprocessing
import json
import urllib
import urllib2

import os
import string
import re



def get_diskes():
    string = commands.getstatusoutput('lshw -class disk')[1]
    # with open('networkes', 'r') as file:
    #   string = file.read()
    print string
    data = string.split("\n")
    objs = []
    obj = None

    for line in data:
        line = line.strip()

        if ('*-disk' in line):
            if (obj is not None):
                objs.append(obj)
                obj is None
            obj = {}
            continue

        if (obj is None):
            continue

        kv = line.split(': ')

        if (len(kv) is not 2):
            continue

        obj[kv[0].strip()] = kv[1].strip()

    #    if(obj is not None):
    #        objs.append(obj)
    #        obj is None

    return objs


def filter_diskes(objs):
    values = []

    for obj in objs:
            o = {}
            o['space'] = int(re.search(r'\d+', obj['size']).group()) * 1024
            o['description'] = obj['description']
            o['type'] = obj['product']
            values.append(o)
    return values


def get_cpues():
    string = commands.getstatusoutput('lshw -class cpu')[1]
    # with open('cpues', 'r') as file:
    #   string = file.read()
    print string
    data = string.split("\n")
    objs = []
    obj = None

    for line in data:
        line = line.strip()

        if ('*-cpu' in line):
            if (obj is not None):
                objs.append(obj)
                obj is None
            obj = {}
            continue

        if (obj is None):
            continue

        kv = line.split(': ')

        if (len(kv) is not 2):
            continue

        obj[kv[0].strip()] = kv[1].strip()

    #    if(obj is not None):
    #        objs.append(obj)
    #        obj is None

    return objs


def filter_cpues(objs):
    values = []
    for obj in objs:
     if (obj.has_key('version') and 'size' not in obj):
        o = {}
        o['clock_speed'] = obj['size']
        o['model'] = obj['version']
    data = string.split(" ")
    conf = {}
    for dd in data:
        kv = dd.split('=')
        conf[kv[0].strip()] = kv[1].strip()
    o['core'] = __grains__['num_cpus']
#    o['thread_num'] = __grains__['threads']
    o['arch'] = __grains__["osarch"]
    values.append(o)


    return values


def get_networkes():
    string = commands.getstatusoutput('lshw -class network')[1]
    # with open('networkes', 'r') as file:
    #   string = file.read()
    print string
    data = string.split("\n")
    objs = []
    obj = None

    for line in data:
        line = line.strip()

        if ('*-network' in line):
            if (obj is not None):
                objs.append(obj)
                obj is None
            obj = {}
            continue

        if (obj is None):
            continue

        kv = line.split(': ')

        if (len(kv) is not 2):
            continue

        obj[kv[0].strip()] = kv[1].strip()

    #    if(obj is not None):
    #        objs.append(obj)
    #        obj is None

    return objs


def filter_networkes(objs):
    values = []

    for obj in objs:
        if ('vnet' not in obj['logical name'] and 'vir' not in obj['logical name'] and obj.has_key('size')):
            o = {}
            o['speed_rate'] = int(re.search(r'\d+', obj['size']).group()) * 1024
            o['type'] = obj['product']
            if ('serial' in obj):
                o['mac_addr'] = obj['serial']
            values.append(o)
    return values


def get_memories():
    string = commands.getstatusoutput('lshw -class memory')[1]
    # with open('memories', 'r') as file:
    #   string = file.read()
    print string
    data = string.split("\n")
    objs = []
    obj = None

    for line in data:
        line = line.strip()

        if ('*-bank' in line):
            if (obj is not None):
                objs.append(obj)
                obj is None
            obj = {}
            continue

        if (obj is None):
            continue

        kv = line.split(':')

        if (len(kv) is not 2):
            continue

        obj[kv[0].strip()] = kv[1].strip()

    if (obj is not None):
        objs.append(obj)
        obj is None

    return objs


def filter_memories(objs):
    values = []

    for obj in objs:
        if ('empty' not in obj['description']):
            o = {}
            o['value'] = int(re.search(r'\d+', obj['size']).group()) * 1024
            values.append(o)

    return values


def run():
    sn = commands.getstatusoutput("echo `dmidecode -s system-serial-number`")[1].split(",")[0]
    hostname = socket.gethostname()
    #  ip = socket.gethostbyname(socket.gethostname())
    ip = get_ip_address('kvmbr0')
    os = commands.getstatusoutput("uname -s")[1].split(",")[0]
    kernel = commands.getstatusoutput("uname -r")[1].split(",")[0]
    os_version = commands.getstatusoutput("cat /etc/redhat-release")[1].split(",")[0]

    # CPU: cat /proc/cpuinfo | grep name | cut -f2 -d: | uniq -c
    # awk '/index/{close(p".txt");++p}{print > p".txt"}' file

    url = "http://api.o.vdian.net/servers"
    values = {'sn': sn, 'hostname': hostname, 'ip': ip, 'os_platform': os, 'kernel_version': kernel,
              'os_version': os_version}

    #  return url
    values['memories'] = filter_memories(get_memories())
    values['network_cards'] = filter_networkes(get_networkes())
    values['cpus'] = filter_cpues(get_cpues())
    values['disks'] = filter_diskes(get_diskes())

    message = ''

    try:
        req = urllib2.Request(url, json.dumps(values),
                              headers={'Content-type': 'application/json', 'Accept': 'application/json',
                                       'Authorization': 'Bearer OOgLHt0NkajY89XoeUGYSNbihToUpL2F'})
        response = urllib2.urlopen(req)
        the_page = response.read()
    except urllib2.HTTPError, error:
        message = error.read()

    return values
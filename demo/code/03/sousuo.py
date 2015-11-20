import commands
import socket

import socket
import fcntl
import struct

import time
import threading, multiprocessing
import json

import requests

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

        kv = line.split(':')

        if (len(kv) is not 2):
            continue

        obj[kv[0].strip()] = kv[1].strip()

    if (obj is not None):
        objs.append(obj)
        obj is None

    return objs


def filter_diskes(objs):
    values = []

    for obj in objs:
        o = {}
        o['description'] = obj['description']
        if ('size' in obj):
            o['space'] = int(re.search(r'\d+', obj['size']).group()) * 1024
        if ('product' in obj):
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

    # if(obj is not None):
    #        objs.append(obj)
    #        obj is None

    return objs


def filter_cpues(objs):
    values = []
    for obj in objs:
        o = {}
        if ('size' in obj):
            o['clock_speed'] = obj['size']
        if ('version' in obj):
            o['model'] = obj['version']
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

    # if(obj is not None):
    #        objs.append(obj)
    #        obj is None

    return objs


def filter_networkes(objs):
    values = []

    for obj in objs:
        if (obj.has_key('logical name')):
            if ('vnet' not in obj['logical name'] and 'vir' not in obj['logical name'] and obj.has_key(
                    'size') and obj.has_key('logical name')):
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
            if ('size' in obj):
                o['value'] = int(re.search(r'\d+', obj['size']).group()) * 1024
            values.append(o)

    return values


def send_request(path, method, params={}, json={}):
    url = 'http://api.o.vdian.net/' + path

    headers = {}
    headers['Content-type'] = 'application/json'
    headers['Authorization'] = 'Bearer LGh8Izrq8lh7uPDlZvYbLy5Js9fjDf3g'

    return getattr(requests, method)(url, params=params, headers=headers, json=json)

def get_id_by_sn(sn):
    r = send_request('servers', 'get', params={'sn': sn})
    result = r.json()

    if (len(result) < 1):
        return 0

    return result[0]['id']
#    return result

def get_parent_sn(sn):
    kv = sn.split('_')
    if(len(kv) < 2):
        return None
    return kv[0]


def run():
    sn = commands.getstatusoutput("echo `dmidecode -s system-serial-number | grep -v "^#"`")[1].split(",")[0]
    hostname = socket.gethostname()
    if ('kvmbr0' in __grains__['ip4_interfaces']):
        local_ip = __grains__['ip4_interfaces']['kvmbr0'][0]
    elif ('eth0' in __grains__['ip4_interfaces']):
        local_ip = __grains__['ip4_interfaces']['eth0'][0]
    elif ('em1' in __grains__['ip4_interfaces']):
        local_ip = __grains__['ip4_interfaces']['em1'][0]
    os = __grains__['kernel']
    kernel = __grains__['kernelrelease']
    os_version = commands.getstatusoutput("cat /etc/redhat-release")[1].split(",")[0]
    idc_id = __grains__['IDC']

    values = {'sn': sn, 'hostname': hostname, 'ip': local_ip, 'os_platform': os, 'kernel_version': kernel,
              'os_version': os_version}

    values['memories'] = filter_memories(get_memories())
    values['network_cards'] = filter_networkes(get_networkes())
    values['cpus'] = filter_cpues(get_cpues())
    values['disks'] = filter_diskes(get_diskes())
    # values['idc_room_id'] = idc_id
    values['status'] = 1

    id = get_id_by_sn(sn)
    parent_sn = get_parent_sn(sn)

    if(parent_sn is None):
        values['parent_id'] = 0
    else:
        parent_id = get_id_by_sn(parent_sn)
        values['parent_id'] = parent_id

    if (id is 0):
        method = 'post'
        path = 'servers'
    else:
        method = 'put'
        path = 'servers/' + str(id)


    r = send_request(path, method, json=values)

#    return values['idc_id']
#    return values['parent_id']
    return r.content
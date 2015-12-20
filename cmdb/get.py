#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
import requests
import json
headers = {"Content-Type": "application/json"}
url = 'http://api.51reboot.com/api'
data = {
        "jsonrpc": "2.0",
        "method":"idc.get",
        "id":1,
        "auth":None,
        "params":{
                'output':['id','name','idc_name','address','user_interface'],
                'limit' : 4,
                'order_by':'id desc'
        }
}

r = requests.post(url, headers=headers, json=json.dumps(data))
print r.status_code
print r.content

import os
import imp
# 获取目录
file_path = os.getcwd()
print file_path
file_name = 'vipspider'
a = imp.find_module(file_name, [file_path])
print a
mod_all = imp.load_module(file_name, a[0], a[1], a[2])

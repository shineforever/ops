#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
import requests
import json
headers = {"Content-Type": "application/json"}
url = 'http://api.51reboot.com/api'
data = {
        "jsonrpc": "2.0",
        "method":"idc.create",
        "id":5,
        "auth":None,
        "params":{
            'name' : 'hz-longbao',   #机房名不可重复，否则报错
            'idc_name' : 'HP',
            'address' : 'hz',
            'phone' : '18612326110',
            'email' : '358377264@qq.com',
            'user_interface' : 'wd',
            'user_phone' : '1234567',
            'rel_cabinet_num' : 10,
            'pact_cabinet_num' : 5,
        }
}

r = requests.post(url, headers=headers, json=json.dumps(data))
print r.status_code
print r.content
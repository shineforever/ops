#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
import requests
import json
headers = {"Content-Type": "application/json"}
url = 'http://api.51reboot.com/api'
data = {
        "jsonrpc": "2.0",
        "method":"idc.update",
        "id":1,
        "auth":None,
        "params":{
            'data'  : {'user_interface':'macos','user_phone':'6110','user_interface':'hello 51reboot'},
            'where' : {'id':1}
        }
}

r = requests.post(url, headers=headers, json=json.dumps(data))
print r.status_code
print r.content
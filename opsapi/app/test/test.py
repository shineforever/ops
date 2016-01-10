# coding:utf-8
import requests
import json

url = "http://127.0.0.1:5000/api"
headers = {"Content-type": "application/json"}

data = {
    "jsonrpc": 2.0,
    "method": "idc.update",
    "id": 1,
    "auth": None,
    "params": {
        "data":{"name":"albert"},
        "where":{"id":1}
    }

}

data3 = {
    "jsonrpc": 2.0,
    "method": "idc.create",
    "id": 1,
    "auth": None,
    "params": {
               "name": 'wd',
               "idc_name": "杭州拱墅",
               "address": "杭州拱墅",
               "phone": "18667156110",
               "email": "358377264@QQ.COM",
               "user_interface":"albert",
               "user_phone": "18667156111",
               "rel_cabinet_num":"30",
               "pact_cabinet_num":"40",
               }

}

data2 = {
    "jsonrpc": 2.0,
    "method": "idc.get",
    "id": 1,
    "auth": None,
    "params": {}
}

r = requests.post(url, headers=headers, json=json.dumps(data2))

print r.status_code
print r.content
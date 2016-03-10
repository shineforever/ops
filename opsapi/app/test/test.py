# coding:utf-8
import requests
import json

url = "http://127.0.0.1:5000/api"
headers = {"Content-type": "application/json"}

data = {
    "jsonrpc": 2.0,
    "method": "power.update",
    "id": 1,
    "auth": None,
    "params": {
        "data":{"server_power":"320"},
        "where":{"id":1}
    }
}

data3 = {
    "jsonrpc": 2.0,
    "method": "manufacturer.create",
    "id": 1,
    "auth": None,
    "params": {
               "name": 'zhang',
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
    "method": "product.get",
    "id": 1,
    "auth": None,
    "params": {}
}

data4 = {
    "jsonrpc": 2.0,
    "method": "switch.create",
    "id": 1,
    "auth": None,
    "params": {
               "switch_name": '1',
               "switch_type": 'cisco 2960',
               "manager_ip": '172.16.1.12',
               "category": '网络设备',
               "idc_id": '1',
               "cabinet_id": '1',
               "status": '1',
               "expire": '2088-1-1',
               "remark": 'q1 采购的',
               "manufacturers": '1',
               "last_op_time": '2016-1-13',
               "last_op_people": '1',
               "switch_port_nums": '1'
               }

}

data5 = {
    "jsonrpc": 2.0,
    "method": "product.create",
    "id": 1,
    "auth": None,
    "params": {
         "service_name": "交易中心",
         "pid": "0",
         "module_letter": '1000',
         "dev_interface": '358377264@qq.com',
         "op_interface": '358377264@qq.com'

    }
}

r = requests.post(url, headers=headers, json=json.dumps(data5))


print r.status_code
print json.loads(r.content)


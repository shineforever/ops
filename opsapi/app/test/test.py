import requests
import json

url = "http://127.0.0.1:5000/api"
headers = {"Content-type": "application/json"}

data = {
    "jsonrpc": 2.0,
    "method": "idc.create",
    "id": 1,
    "auth": 'null',
    "params": {'name':'wd'},

}
r = requests.post(url,headers=headers,json=json.dumps(data))

print r.status_code
print r.content
# coding:utf-8
import requests
import json,urllib2

url = "http://100.73.11.50:8080/opsmanager/server/addServerByUrl"
headers = {"Content-type": "application/json"}
#
# data = {
#  "server_ip": "100.73.11.113",
#  "serveruser_name": "root",
#  "serveruser_pwd": "aJ3powei@FNcloud",
#  "environment": "stable"
# }
#
# print json.dumps(data)
# r = requests.post(url, headers=headers, json=json.dumps(data))
#
# print r.status_code
# print r.content
# print json.loads(r.content)

for i in range(22, 113):
    data = {
     "server_ip": ".".join(["100.73.11", str(i)]),
     "serveruser_name": "root",
     "serveruser_pwd": "aJ3powei@FNcloud",
     "environment": "stable"
    }
    print json.dumps(data)
    r = requests.post(url, headers=headers, json=json.dumps(data))

for i in range(2, 92):
    data = {
     "server_ip": ".".join(["100.73.10", str(i)]),
     "serveruser_name": "root",
     "serveruser_pwd": "aJ3powei@FNcloud",
     "environment": "stable"
    }
    print json.dumps(data)
    r = requests.post(url, headers=headers, json=json.dumps(data))

print r.status_code
print r.content
print json.loads(r.content)


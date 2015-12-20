#!/usr/bin/env python
#coding:utf-8
from flask import Flask,request
import base64,time,random,json
app = Flask(__name__)



def create_token(name,uid,role):
	token = base64.b64encode('%s|%s|%s|%s|%s'%(name,uid,role,str(random.random()),int(time.time()+7200)))  
	return token
    
def verify_token(token):
	t = int(time.time())
	key = base64.b64decode(token)
	x = key.split('|')
	if len(x)!=5:
		return json.dumps({'code':1,'errmsg':'token参数不足'})
	if t > int(x[4]):	 
		return json.dumps({'code':1,'errmsg':'登录已过期'})
	else:
		return json.dumps({'code':0,'username':x[0],'uid':x[1],'role':x[2]})

@app.route('/login',methods=['GET','POST'])
def login():
	name = request.form.get('name')
	passwd = request.form.get('passwd')
	if name == "wd" and passwd == "123456":
		uid = 1
		role = 1               
		token = create_token(name,uid,role)
		return json.dumps({'code':0,'token':'%s' % token})
	else:
		return json.dumps({'code':1,'errmsg':'token 创建失败'})



@app.route('/',methods=['GET','POST','PUT'])
def index():
	token = request.args.get('token')
	result = verify_token(token)   #{"username": "wd", "code": 0, "role": "0", "uid": "1"}
	result=json.loads(result)
	if int(result['code']) == 1:
		return  "error: %s" % result['errmsg']
	if int(result["role"]) == 0:
		return "%s is admin, you can do everything" % result['username']
	else:
		return "%s is not admin, request refuse"  % result['username']


if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5002,debug=True)
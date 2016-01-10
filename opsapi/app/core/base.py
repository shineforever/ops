#!/usr/bin/env python
#_*_coding:utf-8_*_
import os
import imp
__auth__='albert'

"""
1.确定目录,modules
2.列出目录下所有文 件
3.循环所有文 件名,找出.py结尾的文 件名
4. 需要加载的模块名与当前循环的文 件名是否一样
5.加载这个模块
6.判断这个模块有没有指定的方法
7.返回这个方法
8.执行这个方法
"""

class AutoLoad():
    def __init__(self,module_name):
        DIR = os.path.abspath(os.path.dirname(__file__))
        self.moduleDir = os.path.join(os.path.dirname(DIR),"modules")
        self.module_name = module_name
        self.method = None

    def isValidModule(self):
        return self._load_module()

    def isValidMethod(self,func=None):
        self.method = func
        return hasattr(self.module,self.method)

    def getCallMethod(self):
        if hasattr(self.module,self.method):
            return getattr(self.module,self.method)
        else:
            return None

    def _load_module(self):
        ret = False
        dirlist = os.listdir(self.moduleDir)

        for fn in dirlist:
            if fn.endswith('.py'):
                module_name = fn.rstrip(".py")
                if self.module_name == module_name:
                    fp, pathname,desc = imp.find_module(module_name,[self.moduleDir])
                    if not fp:
                        continue
                    try:
                        self.module = imp.load_module(module_name,fp,pathname,desc)
                        ret = True
                    finally:
                        fp.close()
                        break
                else:
                    print "module has no find"
        return ret

class Response():
    def __init__(self):
        self.data = None
        self.errorCode = 0
        self.errorMessage = None

class JsonRpc(object):
    def __init__(self,jsonData):
        self.VERSION = "2.0"
        self._error = True
        self.jsonData = jsonData
        self._response = {}

    def execute(self):
        if not self.jsonData.get('id',None):
            self.jsonData['id'] = None

        if self.validate():
            params = self.jsonData.get('params',None)
            auth = self.jsonData.get('auth',None)
            module,func = self.jsonData.get("method","").split(".")
            ret = self.callMethod(module,func,params,auth)
            self.procesResult(ret)
        return self._response

    def procesResult(self,response):
        if response.errorCode != 0:
            self.jsonError(self.jsonData.get('id'),response.errorCode,response.errorMessage)
        else:
            self._response = {
                "jsonrpc": self.VERSION,
                "result": response.data,
                "id": self.jsonData.get('id')
            }


    def callMethod(self,module,func,params,auth):
        module_name = module.lower()
        func = func.lower()
        response = Response()
        autoload = AutoLoad(module_name)

        if not autoload.isValidModule():
            response.errorCode = 106
            response.errorMessage = "指定的模块不存在"
            return response


        if not autoload.isValidMethod(func):
            response.errorCode = 107
            response.errorMessage = "{} 下没有{}该方法".format(module_name,func)
            return response

        flag = self.requireAuthentication(module_name,func)
        if flag:
            if auth is None:
                response.errorCode = 108
                response.errorMessage = "该操作需要提供token"
                return response
            else:
                pass
        try:
            called = autoload.getCallMethod()
            if callable(called):
                response.data = called(**params)  # *多个参数 **字典
            else:
                response.errorCode = 109
                response.errorMessage = "{}.{} 不能被调用".format(module_name,func)
        except Exception,e:
            response.errorCode = -1
            response.errorMessage = e.message
            return response
        return response

    def requireAuthentication(self,module,func):
        if module == "user" and func == "login":
            return False
        if module == "reboot":
            return False
        return False

    def validate(self):
        if not self.jsonData.get('jsonrpc',None):
            self.jsonError(self.jsonData.get('id',0), 101 ,"参数json没有传")
            return False
        if str(self.jsonData.get("jsonrpc")) != self.VERSION:
            self.jsonError(self.jsonData.get('id',0), 102 ,"参数jsonrpc的版本不正确,应该为{}".format(self.VERSION))
            return False
        if not self.jsonData.get('method',None):
            self.jsonError(self.jsonData.get('id',0), 103 ,"参数method没有传")
            return False
        if "." not in self.jsonData.get('method'):
            self.jsonError(self.jsonData.get('id',0), 105, "参数格式不正确")
            return False

        print self.jsonData.get("method")
        print isinstance(self.jsonData.get("params"),dict)


        if self.jsonData.get("params",None) is None:
            self.jsonError(self.jsonData.get('id',0), 106, "params 没有传")

        if not isinstance(self.jsonData.get("params",None),dict):
            self.jsonError(self.jsonData.get('id',0), 104, "params 应该为dict")
            return False

        return True


    def jsonError(self,id,errno,errmsg):
        self._error = True
        format_err = {
            "jsonrpc": self.VERSION,
            "error": errmsg,
            "errorno": errno,
            "id": id,
        }
        self._response=format_err
"""
101 ,"参数json没有传"
102 ,"参数jsonrpc的版本不正确,应该为{}
103 ,"参数method没有传"
104, "params 应该为dict
105, "参数格式不正确"
106, "params 没有传"
107, {} 下没有{}该方法
108, 该操作需要提供token
109,{}.{} 不能被调用
"""

if __name__ == "__main__":
    # at = AutoLoad('idc')
    # at.isValidModule()
    # at.isValidMethod('create')
    # func = at.getCallMethod()
    # func()
    data = {
            "jsonrpc": 2.0,
            "auth": 'null',
            "method": 'idc.init',
            "params": {'name':'wd'},
            "id": 2
    }
    jrpc = JsonRpc(data)
    ret = jrpc.execute()
    print ret
# -*- coding: utf-8 -*-
import os,sys
#import idc
import json

class AutoLoad(object):

    def __init__(self, module_name):
		self.moduledir = os.path.dirname(module_name)
		self.module = 'idc'
		self.module_name = module_name
		self.method = None
		self.idc_methodlist = ['create','get','update']

	def isValidMethod(self, func=None):

		self.method = func
		if self.method not in  self.methodlist:
			return hasattr(self,method)

	def isValidModule(self,module_name):

		if module_name  not in self.module:
			return self._load_module()

	def getCallMethod(self,module,method):

		if module in idc.methood:

			return method

	def _load_module(self):

		ret = False
		for filename in (os.listdir(self.moduledir)):
			if "py" in filename.split['.'][1]:
				module_name = filename.split['.'][0]
		if module_name == self.module_name:
			fp, pathname, desc = imp.find_module(module_name, [self.moduleDIR])
			if not fp:
				continue
			try:
				self.module = imp.load_module(module_name, fp, pathname, desc)
				ret = True
			except:
				fp.close()
				break
				return ret

class Response(object):

	def __init__(self):
		self.data = None
		self.errorCode = 0
		self.errorMessage = None

class JsonRpc(object):

	def execute(self):

		if id is not None:
			return id

		if validate():

			result = callMethod('idc','get',params=params,auth=None)
			return result
		else:
			return self.response

	def callMethod(self, module, func, params, auth):

		response = Response()
		at = AutoLoad(module)

		if not at._load_module():
			response.errorCode = '-100'
			response.errorMessage = "模块不存在"
			return False

		if 	not at.isValidMethod():
			response.errorCode = '-101'
			response.errorMessage = '函数不存在'
			return False

		flag = requiresAuthentication()

		if not flag and auth is not None:
			return False

		if flag:
			if token is None:
				return false

			else:
				if auth == '0':
					response.errorCode = '-102'
					response.errorMessage = '没有权限'
					return False

		try:
			called = at.getCallMethod()
			if called in at.idc_methodlist:
				response.data = called(**params)
				return response.data
			else:
				response.errorCode = '-103'
				response.errorMessage = "该函数可以执行"
		except:
			response.errorcode = '-104'
			response.errormsg = '该函数状异常'
			return False

		return response

	def requiresAuthentication(self, module, func):

		if module == "user" and func == "login":
			return False

		return True

	def validate(self):

		if VERSON != '2.0':
			response.errorCode = '-104'
			response.errorMessage = "目前只支持2.0"
			jsonError()
			return False

		if method not in at.idc_methodlist:
			response.errorCode = '-105'
			response.errorMessage = "函数不支持"
			jsonError()
			return False

		if len(params) <= 0:
			response.errorCode = '-106'
			response.errorMessage = "请传递参数"
			jsonError()
			return False

		return True
	    
	def jsonError(self, id, errno, data=None):

		format_error = {
			'jsonrpc': VERSION,
			'error' : data,
			'id': id,
			'errno': errno,
		}
		self.response = json.dumps(format_error)

	def processResult(self, response):

		VERSION = '2.0'
		if response.errorCode != 0 :
			errno = response.errorCode
			jsonError()
		else:
			formatResp = {
				"jsonrpc": VERSION,
				"result": response.data,
				"id": json.id
			}
			self.response = json.dumps(formatResp)

		return  response

	def isError(self):
		if len(self.response) <= 0:
			return False



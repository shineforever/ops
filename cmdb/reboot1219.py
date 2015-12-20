

class AutoLoad(object):
    """
        自动加载类
    """
    def __init__(self, module_name):
	self.moduledir = 获取模块所在的目录
	self.module = None
	self.module_name = module_name
	self.method = None

    def isValidMethod(self, func=None):
        """
            判断方法是否可用
        """
	self.mothod = func
	return hasattr()

    def isValidModule(self):
        """
            判断模块是否可加载
        """
	return self._load_module()

    def getCallMethod(self):
        """
            返回可执行的方法
        """
	if 这个模块有这个方法，
		返回这个方法
	return none

    def _load_module(self):
        """
            加载模块
        """
	ret = False
	for filename in (ls self.moduledir):
	    if filename 以.py结尾:
	        module_name = filename去掉.py
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
    """
        定义一个response对象
    """
    def __init__(self):
        self.data = None            # 返回的数据
        self.errorCode = 0          # 错误码
        self.errorMessage = None    # 错误信息



class JsonRpc(object):

    def execute(self):
        """
            执行指定的方法
            返回执行后的结果
        """
	验证id
	验证json -> validate()
	    true
		执行具体的操作  idc.get  -> callMethod()
		处理返回结果
	    false
        return self.response
	

    def callMethod(self, module, func, params, auth):
        """
            加载模块
            验证权限
            执行方法
            返回response
        """
	response = Response()
	at = AutoLoad(module)
	验证模块是否可加载
	    false
		response.errorcode = -100
		response.errorMessage = "模块不存在"
		return false
	验证函数是否可调用
	    false
		......
	
	flag = requiresAuthentication()  # 判断该操作是否需要验证  true: 需要
	"""
	if not flag 且 auth is not nune:
	    false
		......
	""""
	
	if flag: (需要进行验证)
		if 没有提供token
			false
				.......
		else:
			验证有没有权限操作：(idc.get)
				false:
					......
	try:
		called = 获取要操作的方法
		如果 called 可以执行
			response.data = called(**params)
			处理返回结果
		else:
			errorcode = 
			errormsg = ""
	except:
		response.errorcode = 
		response.errormsg = ""	
		return false
	return response
	


    def requiresAuthentication(self, module, func):
        """
            判断需要执行的API是否需要验证
        """
	如果 module == "user" 且 func == "login":
	    return False
	return True

    def validate(self):
        """
            验证json，以及json传参
        """
	验证jsonrpc, 验证版本
	    false,  return false
		调用jsonError()
	验证method, (idc.get)
	    false,  return false
		调用jsonError()
	验证params, 是否传
	    false   return false
		调用jsonError()
	return True
	    
    def jsonError(self, id, errno, data=None):
        """
            处理json错误
        """
	_error = True
	format_error = {
		'jsonrpc': VERSION,
		'error' : data,
		'id': id,
		'errno': errno,
	}
	self.response = format_error

    def processResult(self, response):
        """
            处理执行后返回的结果
        """
	if response.errorCode 不为 0 :
		errno = response.errorCode
		jsonError()
	else:
		formatResp = {
			"jsonrpc": VERSION,
			"result": response.data,
			"id": json.id
		}
		self.response = formatResp

    def isError(self):
        """
            返回是否有错误
        """



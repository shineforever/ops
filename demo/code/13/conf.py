import xml.dom.minidom
#从xml文件读取数据库配置的类
class CDBConfig:
  def __init__(self,ConfigFilePath):                #ConfigFilePath是配置文件的路径
    self.__ConfigFilePath=ConfigFilePath
    CDBConfig.DBConnects={}                        #CDBConfig.DBConnects是CDBConfig类的静态字典成员，用来存放数据库访问串    
    self.ConfigXMLFile()                                    #从XML文件中读取数据可连接信息
  #定义往连接数据字典里增加连接的方法
  def AddConnect(self,key,server="(localhost)",database="master",user="sa",password="",dbtype="SQLServer"):
    if dbtype=="SQLServer" :
      self.__sconn = "server=" + server + ";database=" + database + ";uid=" + user +";pwd=" + password;
      CDBConfig.DBConnects[key]=self.__sconn
      #定义读取XML文件的方法
  def ConfigXMLFile(self):
    self.__key = ""
    self.__server = ""
    self.__database = ""
    self.__user = ""
    self.__password = ""
    self.__xmlFile=open(self.__ConfigFilePath,'r')                        #只读打开配置文件
    self.__dom=xml.dom.minidom.parse(self.__xmlFile)                #解析xml
    self.__xmlFile.close()                                                                    #关闭文件
    self.__connect_elements=self.__dom.getElementsByTagName("DBConnection")       #取得所有的DBConnection节
    for connect_element in self.__connect_elements:                    #每个DBConnection节都是一个连接串
        self.__key      = connect_element.getAttribute("Key")
        self.__server   = connect_element.getAttribute("Server")
        self.__database = connect_element.getAttribute("Database")
        self.__user     = connect_element.getAttribute("User")
        self.__password = connect_element.getAttribute("Password")
        self.AddConnect(self.__key,self.__server,self.__database,self.__user,self.__password,dbtype="SQLServer")
        print '---------key为',self.__key,'的DBConnection----------'
        print self.__key
        print self.__server
        print self.__database
        print self.__user
        print self.__password 
if __name__=="__main__":                           
    myconns=CDBConfig("connection.xml")
    for key in CDBConfig.DBConnects.keys():#对每一个key执行
      print '-------------打印每个数据库的连接--------------'
      print key+'\t'                                               #把每个数据库联接都打印出来



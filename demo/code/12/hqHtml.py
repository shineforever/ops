import httplib
import urllib
rsw=raw_input('请输入你想要的操作：直接保存资源（Z），获得资源的状态码（H）')
if rsw=='H':
    print '--------我是可以获得URL资源的状态码方式------------'
    connection=httplib.HTTPConnection('localhost')
    connection.request('GET','/friend.html')
    re=connection.getresponse()    
    print re.status,re.reason
    print re.read()
    connection.close()
elif rsw=='Z':
    print '-------我可以执行下载的操作，你可以打开F://dcy/文件查看哦------'
    url = 'http://localhost/friend.html'
    path='F://dcy/friend.html'
    data = urllib.urlretrieve(url,path)
else:
    print '系统没有为您设置资源'
    

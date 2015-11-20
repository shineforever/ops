#-*—coding:utf8-*-
import requests
import re
#下面三行是编码转换的功能，大家现在不用关心。
import sys
reload(sys)
sys.setdefaultencoding("utf-8")

#hea是我们自己构造的一个字典，里面保存了user-agent
hea = {'User-Agent':'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'}
# html = requests.get('http://jp.tingroom.com/yuedu/yd300p/')
html = requests.get('http://jp.tingroom.com/yuedu/yd300p/',headers = hea)

html.encoding = 'utf-8' #这一行是将编码转为utf-8否则中文会显示乱码。
# print html.text
# title = re.findall('color:#666666;">(.*?)</span>',html.text,re.S)
# for each in title:
#     print each
#
chinese = re.findall('color: #039;">(.*?)</a>',html.text,re.S)
for each in chinese:
    print each


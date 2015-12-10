#!/usr/bin/python
#-*- coding: utf-8 -*- 
import urllib,re
import os,sys
from bs4 import BeautifulSoup as soup
def get_ip(ip):
    a = []
    url = "http://www.ip138.com/ips138.asp?ip={0}&action=2".format(ip)
    opurl = urllib.urlopen(url)
    o_data = opurl.read()
    opurl.close()
    c = soup(o_data)
    data = c.find_all("table",{"width":"80%"})
    for x in  data:
        x_l = ''.join(re.findall(u'本站主数据：(.*)',x.li.text))
        return  '%s  %s \n' % (ip,x_l)

def get_tracert(domain):
    ip_list = []
    data = os.popen('traceroute -d %s ' % domain).readlines()
    b = re.compile(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})')
    data = [  b.findall(x) for x in data ]
    c = []
    for x in data:
        if x != []:
            c = list(set(x))
            for i in c:
                ip_list.append(''.join(i))
    return ip_list

if __name__ == '__main__':
    print '访问%s 经过的路由如下：\n' % sys.argv[1]
    for x in get_tracert(sys.argv[1]):
        print get_ip(x)
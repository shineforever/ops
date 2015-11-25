#-*_coding:utf-8-*-
import requests
import re,sys,os
import json
from lxml import etree

def send_request(path, method,params={},json={}):
    url = 'http://api.o.vdian.net/' + path

    headers = {}
    headers['Content-type'] = 'application/json'
    headers['Authorization'] = 'Bearer LGh8Izrq8lh7uPDlZv' \
                               '' \
                               'YbLy5Js9fjDf3g'

    return getattr(requests, method)(url, params=params, headers=headers, json=json)

def getlist_ip():
    method = 'get'
    path = 'servers'

    r = send_request('servers', 'get',params={'fields':'ip','page': 'false' })

    re = json.loads(r.content)
    values = []
    for r in re:
        values.append(r['ip'])

    return values

class spider(object):
    def __init__(self):
        print u'开始爬取内容........'

    def getsource(self,url,ip):
        html = requests.post(url,data={'input_vip_name':ip})
        return html.text

    def getinfo_vip(self,html):

        selector = etree.HTML(html)
        content = selector.xpath('//td[@width="140"]/text()')

        return content

    def getinfo_vipname(self,html):

        selector = etree.HTML(html)
        content = selector.xpath('//td[@width="300"]/text()')

        return content

    def getinfo_port(self,html):

        selector = etree.HTML(html)
        content = selector.xpath('//td[@width="80"]/text()')

        return content

    def getinfo_protocol(self,html):

        values = []
        selector = etree.HTML(html)
        content = selector.xpath('//td[@width="80"]/text()')

        # for i in content:
        #     if ( str(i).isalpha()):
        #         values.append(i)
        return content

if __name__ == '__main__':

    vip = []
    port = []
    vipname = []
    protocol = []
    url = 'http://10.2.1.211/netscaler.php'
    # iplist = ['10.2.8.120','10.2.8.75']
    vdianspider = spider()
#    print getlist_ip()
    for ip in getlist_ip():
        html = vdianspider.getsource(url,ip)
        vip = vdianspider.getinfo_vip(html)

        for v in vip:
            if (v != vip[0]) :
                print 'vip地址:'+v,

        vipname = vdianspider.getinfo_vipname(html)

        for vip in vipname:
            if (vip != vipname[0]) :
                print  'vip名称:' + vip,

        port = vdianspider.getinfo_port(html)
        for p in port:
            if (str(p).isdigit()) :
                print '端口:'+p,
        print "\n"
        #
        # protocol = vdianspider.getinfo_protocol(html)
        # for pro in protocol:
        #     if ( str(i).isalpha()):
        #         print pro,
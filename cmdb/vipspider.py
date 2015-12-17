#-*_coding:utf-8-*-
import requests
import re,sys,os
import json
from multiprocessing.dummy import Pool as ThreadPool
from lxml import etree

def get_vips_by_ip(ip):
    
    s = spider()
    s.getsource(ip)

    vips = s.getinfo_vip()
    vipnames = s.getinfo_vipname()
    ports = s.getinfo_port()

    index = 0

    values = []

    for vip in vips:
        value = {}
        value['vip'] = vip
        value['domain'] = vipnames[index]
        value['port'] = ports[index]
        values.append(value)
        index = index+1

    return values

def update_server(server):

    ip = server['ip']
    groups = server['groups']

    vips = get_vips_by_ip(ip)
    for vip in vips:
        for group in server['groups']:
            update_vip(group, vip)

def update_vip(group, vip):

    params = {}
    params_name = {}
    params['value'] = vip['vip']
    # params['value'] = vip['domain']
    params['group_id'] = group['id']
    params['port'] = vip['port']

    params_name['value'] = vip['domain']
    params_name['group_id'] = group['id']


    r = send_request('group/vips', 'get', params=params)

    results = json.loads(r.content)
    print results

    if (len(results) > 0):
        send_request('group/vips/' + str(results[0]['id']), 'put', json=params)
        send_request('group/domains' + str(results[0]['id']), 'put', json=params_name)
    else:
        send_request('group/vips', 'post', json=params)
        send_request('group/domains', 'post', json=params_name)

    return

def send_request(path, method,params={},json={}):
    url = 'http://api.o.vdian.net/' + path

    headers = {}
    headers['Content-type'] = 'application/json'
    headers['Authorization'] = 'Bearer LGh8Izrq8lh7uPDlZv' \
                               '' \
                               'YbLy5Js9fjDf3g'

    return getattr(requests, method)(url, params=params, headers=headers, json=json)

def get_servers():
    method = 'get'
    path = 'servers'

    r = send_request(path, method,params={'page': 'false' })

    return json.loads(r.content)


class spider(object):

    def getsource(self,ip):
        url = 'http://10.2.1.211/netscaler.php'
        html = requests.post(url,data={'input_vip_name':ip})

        self.html = html.text

    def getinfo_vip(self):

        selector = etree.HTML(self.html)
        content = selector.xpath('//td[@width="140"]/text()')

        vip = []
        for c in content:
            if (c != content[0]):
                vip.append(c)

        return vip

    def getinfo_vipname(self):

        selector = etree.HTML(self.html)
        content = selector.xpath('//td[@width="300"]/text()')

        vipname = []
        for c in content:
            if (c != content[0]):
                vipname.append(c)

        return vipname

    def getinfo_port(self):

        selector = etree.HTML(self.html)
        content = selector.xpath('//td[@width="80"]/text()')
        port = []
        for c in content:
            if ( str(c).isdigit()):
                port.append(c)

        return port

    def getinfo_protocol(self):

        values = []
        selector = etree.HTML(self.html)
        content = selector.xpath('//td[@width="80"]/text()')

        # for i in content:
        #     if ( str(i).isalpha()):
        #         values.append(i)
        return content

if __name__ == '__main__':
    page = []
    servers = get_servers()
    print '开始爬虫........'
    for server in servers:
        pool = ThreadPool(8)
        results = pool.map(update_server(server), page)
        pool.close()
        pool.join()


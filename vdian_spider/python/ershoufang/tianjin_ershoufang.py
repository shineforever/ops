# _*_ coding: utf-8 _*_

import os
import re
import sys
import urllib
import urllib2
from pyquery import PyQuery as pq
from xml.dom import minidom

url = 'http://www.tjfdc.com.cn/Ashx/Default.ashx?type=chengjiao'

def get_html(url):
    return urllib2.urlopen(url).read()

def get_request(url, method="GET", isApp=0, isAjax=0, port=80):
    req = urllib2.Request(url)
    req.add_header("Accpet-Language","zh-CN,zh;q=0.8,en;q=0.6")
    if method == "POST":
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

    if isApp:
        req.add_header("User-Agent", "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)")
    else:
        req.add_header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
        #req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36")

    if isAjax:
        req.add_header("X-Requested-With", "XMLHttpRequest")

    return req

def request_data(request, param={}):
    param = urllib.urlencode(param)
    data = ''
    response = urllib2.urlopen(request, param)
    data = response.read()
    return data

def parse_html(html):
    base_name = get_base_name()
    result_path = get_result_path()
    txt_name = base_name.replace('.py', '.txt')
    file_name = os.path.join(result_path, txt_name)

    infos = ''
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()

    tags = get_match_list(r'<Result1>[\s\S]*?</Result1>', html)
    for tag in tags:
        date = get_one_match(r'<SAVEDATE>(.*?)</SAVEDATE>', tag)
        count = get_one_match(r'<COUNT>(.*?)</COUNT>', tag)
        area = get_one_match(r'<AREA>(.*?)</AREA>', tag)
        mm_price = get_one_match(r'<MM_PRICE>(.*?)</MM_PRICE>', tag)
        info = [date, count, area, mm_price]
        if count and area and mm_price:
            if date not in infos:
                fw = open(file_name, 'a')
                fw.write(','.join(info).encode('utf8') + '\n')
                fw.close()

def get_result_path():
    return dir_name#os.path.dirname(os.path.abspath(__file__)).replace('python/ershoufang', 'result')

def get_base_name():
    return os.path.basename(__file__)

def get_one_match(pattern, text):
    m = re.search(pattern, text)
    if m:
        return m.groups()[0]
    else:
        return ''

def get_match_list(pattern, text):
    m = re.findall(pattern, text)
    return m

def run():
    request = get_request(url, isAjax=1)
    html = request_data(request)
    parse_html(html)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python tianjin_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

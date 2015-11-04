# _*_ coding: utf-8 _*_

import os
import sys
import urllib
import urllib2
import datetime
from pyquery import PyQuery as pq
import chardet


today = datetime.date.today()
yesterday = str(today + datetime.timedelta(days=-1))
the_day_before_yesterday = str(today + datetime.timedelta(days=-2))

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
    file_name = os.path.join(dir_name, 'guangzhou_ershoufang.txt')
    trs = pq(html)('table.box_tab_style02.lh24.mt10 tr')

    for i in range(1, len(trs)):
        tds = trs.eq(i)('td')
        info = []
        for j in range(1, len(tds)):
            text = tds.eq(j).text()
            chardit = chardet.detect(text);
            # print chardit
            if (chardit['encoding']=='gbk') or (chardit['encoding']=='gb2312'):
                text = text.decode(chardit['encoding'])
            info.append(text.encode('utf8'))

        date = tds.eq(len(tds) - 1).text()
        if date == yesterday:
            fw = open(file_name, 'a')
            fw.write(','.join(info) + '\n')
            fw.close()
        elif date == the_day_before_yesterday:
            return 0
    return 1


def run():
    url = 'http://www.laho.gov.cn/g4cdata/search/laho/clfSearch.jsp'
    page = 0
    while 1:
        clfrandinput = get_html('http://www.laho.gov.cn/g4cdata/search/generateRand.jsp?').split('=')[1]#get checkcode
        request = get_request(url, method="POST")
        param = {
            'pybh': '',
            'xqmc': '',
            'fbzl': '',
            'jgfwStart': '-1',
            'hxs': '-1',
            'hxt': '-1',
            'hxcf': '-1',
            'hxw': '-1',
            'hxyt': '-1',
            'fwyt': '-1',
            'jzmjStart': '-1',
            'xzqh': '-1',
            'jyzt': '-1',
            'zjfwjgmc': '',
            'fbrqStart': '',
            'fbrqEnd': '',
            'imgvalue': '',
            'clfrandinput': clfrandinput,
            'orderfield': '',
            'ordertype': '',
            'chnlname': '',
            'currPage': page,
            'judge': '1'
        }
        html = request_data(request, param);
        if not parse_html(html):
            break
        page += 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python guangzhou_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

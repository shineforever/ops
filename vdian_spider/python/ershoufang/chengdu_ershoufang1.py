# _*_ coding: utf-8 _*_

import os
import sys
import datetime
import urllib2

from pyquery import PyQuery as pq

url = 'http://esf.funi.com/jgwq'

def get_html(url):
    return urllib2.urlopen(url).read()

def parse_html(html):
    html = html.decode('utf8')
    today = str(datetime.date.today())

    date = pq(html)('div.f-left-wang em:eq(0)').text().split(u'）')[0].strip(u'（')

    lis = pq(html)('div.f-left-wang li')

    result_path = get_result_path()
    txt_name = 'chengdu_ershoufang_cunliangfang.txt'
    file_name = os.path.join(result_path, txt_name)
    fw = open(file_name, 'a')
    #fw.write(date.encode('utf8') + '\n')
    for i in range(1, len(lis)):
        company = lis.eq(i)('strong').attr['title']
        zaishou = lis.eq(i)('span.second').text()
        wangqian = lis.eq(i)('span.num').text()
        info = [company, zaishou, wangqian, today]
        fw.write(','.join(info).encode('utf8') + '\n')
    fw.close()

    lis = pq(html)('div.f-right-wang li')

    result_path = get_result_path()
    txt_name = 'chengdu_ershoufang_jingjiren.txt'
    file_name = os.path.join(result_path, txt_name)
    fw = open(file_name, 'a')
    #fw.write(date.encode('utf8') + '\n')
    for i in range(1, len(lis)):
        paiming = lis.eq(i)('strong.pm').text()
        jjr = lis.eq(i)('span.jjr').text()
        bh = lis.eq(i)('span.bh').text()
        ts = lis.eq(i)('span.ts').text()
        wq = lis.eq(i)('span.wq').text()
        name = lis.eq(i)('span.name').text()
        info = [paiming, jjr, bh, ts, wq, name, today]
        fw.write(','.join(info).encode('utf8') + '\n')
    fw.close()

def get_result_path():
    return dir_name#os.path.dirname(os.path.abspath(__file__)).replace('python/ershoufang', 'result')

def get_base_name():
    return os.path.basename(__file__)

def run():
    html = get_html(url)
    parse_html(html)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python chengdu_ershoufang1.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

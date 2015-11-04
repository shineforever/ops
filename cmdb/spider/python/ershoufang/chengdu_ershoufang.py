# _*_ coding: utf-8 _*_

import types
import os
import sys
import urllib2
from pyquery import PyQuery as pq

url = 'http://www.cdfgj.gov.cn/SCXX/Default.aspx'

def get_html(url):
    return urllib2.urlopen(url).read()

def parse_html(html):
    base_name = get_base_name()
    result_path = get_result_path()    
    txt_name = base_name.replace('.py', '.txt')
    file_name = os.path.join(result_path, txt_name)

    html = html.decode('utf8')
    trs = pq(html)('table:eq(26) tr')
    date = pq(html)('#ID_ucDefault_UcHead1_HeadHead span:eq(1)').text().split()[0].strip().replace('今天是'.decode('utf8'), '')
    infos = ''
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()
    if date not in infos:
        fw = open(file_name, 'a')
        for i in range(2, len(trs)):
            info = trs.eq(i).text().split()
            info.append(date)
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
        print 'usage: python chengdu_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

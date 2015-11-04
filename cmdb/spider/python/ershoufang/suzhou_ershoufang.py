# _*_ coding: utf-8 _*_

import os
import sys
import urllib2
from pyquery import PyQuery as pq

url = 'http://clf.szfcweb.com/xsinfo.aspx'

def get_html(url):
    return urllib2.urlopen(url).read()

def parse_html(html):
    base_name = get_base_name()
    result_path = get_result_path()
    txt_name = base_name.replace('.py', '.txt')
    file_name = os.path.join(result_path, txt_name)

    html = html.decode('utf8')
    table = pq(html)('#ctl00_ContentPlaceHolder1_mytable')
    date = table('caption').text().strip(u'即时成交信息【').strip(u'】')
    infos = ''
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()
    if date not in infos:
        fw = open(file_name, 'a')
        trs = table('tr')
        for i in range(6):
            k = i * 2 + 1
            txt1 = trs.eq(k).text().split()
            txt2 = trs.eq(k + 1).text().split()
            region = txt1[0]
            info = [date, region, txt1[-2], txt1[-1], txt2[-2], txt2[-1]]
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
        print 'usage: python suzhou_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

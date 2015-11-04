# _*_ coding: utf-8 _*_

import os
import sys
import urllib2
from pyquery import PyQuery as pq

url = 'http://210.75.213.188/shh/portal/bjjs/index.aspx'

def get_html(url):
    return urllib2.urlopen(url).read()

def parse_html(html):
    file_name = os.path.join(dir_name, 'beijing_ershoufang.txt')
    html = html.decode('utf8')
    trs = pq(html)('table.tjInfo:eq(2) tr')
    date = trs.eq(0).text().replace(u'存量房网上签约', '')
    info = [date.encode('utf8')]
    infos = ''
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()
    if date not in infos:
        fw = open(file_name, 'a')
        tds = trs('td')
        for td in tds:
            info.append(pq(td).text().encode('utf8'))
        fw.write(','.join(info) + '\n')
        fw.close()


def run():
    html = get_html(url)
    parse_html(html)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python beijing_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

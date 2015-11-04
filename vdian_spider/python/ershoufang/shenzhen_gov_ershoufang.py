# _*_ coding: utf-8 _*_

import os
import sys
import urllib2
from pyquery import PyQuery as pq

count_by_user_url = 'http://ris.szpl.gov.cn/credit/showcjgs/esfcjgs.aspx'
top_ten_url = 'http://ris.szpl.gov.cn/credit/showcjgs/esfTop10.aspx'

def get_html(url):
    return urllib2.urlopen(url).read()

def parse_count_by_use(html):
    file_name1 = os.path.join(dir_name, 'shenzhen_gov_ershoufang_count_by_use_day.txt')
    file_name2 = os.path.join(dir_name, 'shenzhen_gov_ershoufang_count_by_use_month.txt')
    table1 = pq(html)("#ctl00_ContentPlaceHolder1_clientList1 tr")
    table2 = pq(html)("#ctl00_ContentPlaceHolder1_clientList2 tr")
    date1 = pq(html)('#ctl00_ContentPlaceHolder1_lblCurTime1').text()
    date2 = pq(html)('#ctl00_ContentPlaceHolder1_lblCurTime2').text()
    infos1 = infos2 = ''
    if os.path.exists(file_name1):
        fr = open(file_name1, 'r')
        infos1 = fr.read().decode('utf8')
        fr.close()
    if os.path.exists(file_name2):
        fr = open(file_name2, 'r')
        infos2 = fr.read().decode('utf8')
        fr.close()

    info1 = [date1]
    info2 = [date2]
    for tr in table1:
        tds = pq(tr)('td')
        title = tds.eq(0).text()
        if title:
            info1.append(tds.eq(1).text().strip())
            info1.append(tds.eq(2).text().strip())
    for tr in table2:
        tds = pq(tr)('td')
        title = tds.eq(0).text()
        if title:
            info2.append(tds.eq(1).text().strip())
            info2.append(tds.eq(2).text().strip())
    for i in range(len(info1)):
        info1[i] = info1[i].encode('utf8')
    for i in range(len(info2)):
        info2[i] = info2[i].encode('utf8')

    if date1 not in infos1:
        fw1 = open(file_name1, 'a')
        fw1.write(','.join(info1) + '\n')
        fw1.close()
    if date2 not in infos2:
        fw2 = open(file_name2, 'a')
        fw2.write(','.join(info2) + '\n')
        fw2.close()


def parse_top_ten(html):
    file_name = os.path.join(dir_name, 'shenzhen_gov_ershoufang_top_ten.txt')
    html = html.decode('utf8')
    trs = pq(html)('#divTable table tr')
    date = trs.eq(0).text().replace(u'深圳市', '').replace(u'全市二手房成交前十名的中介', '')
    infos = ''
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()
    if date not in infos:
        fw = open(file_name, 'a')
        for i in range(2, len(trs)):
            tds = trs.eq(i)('td')
            name = tds.eq(0).text()
            num = tds.eq(1).text()
            area = tds.eq(2).text()
            info = [date, name, num, area]
            for i in range(len(info)):
                info[i] = info[i].encode('utf8')
            fw.write(','.join(info) + '\n')
        fw.close()


def run():
    html1 = get_html(count_by_user_url)
    html2 = get_html(top_ten_url)
    parse_count_by_use(html1)
    parse_top_ten(html2)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python shenzhen_gov_ershoufang.py [path of result]'
    else:
        global dir_name
        dir_name = sys.argv[1]
        run()

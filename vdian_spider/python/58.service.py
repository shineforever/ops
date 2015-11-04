#coding:utf8

from pyquery import PyQuery as pq
import urllib2
import time


URL = 'http://bj.58.com'


def get_category():
    category = []
    html = urllib2.urlopen(URL + '/huangye/').read()
    htmlPq = pq(html)("h5 a");
    fw = open('category1.txt', 'w')
    for i in range(len(htmlPq)):
        url = URL + htmlPq.eq(i).attr['href']
        cname = htmlPq.eq(i).text()
        entity = cname + ',' + url + '\n'
        fw.write(entity.encode('utf8'))
    fw.close()

def get_sub_category():
    fr = open('category1.txt', 'r')
    fw = open('category2.txt', 'w')
    for line in fr:
        (name, url) = line.strip().split(',')
        print 'processing ', name
        html = urllib2.urlopen(url).read()
        htmlPq = pq(html)("div.cb h2 a")
        for i in range(len(htmlPq)):
            sub_name = htmlPq.eq(i).text().encode('utf8')
            sub_ename = htmlPq.eq(i).attr['href'].split('/')[3].encode('utf8')
            entity = name + ',' + sub_name + ',' + sub_ename + '\n'
            fw.write(entity)
        time.sleep(3)
    fr.close()
    fw.close()

def get_min_category():
    fr = open('category2.txt', 'r')
    fw = open('category3.txt', 'w')
    for line in fr:
        (name, sub_name, sub_ename) = line.strip().split(',')
        print 'processing ', name, sub_name
        url = URL + '/' + sub_ename
        html = urllib2.urlopen(url).read()
        htmlPq = pq(html)("#ObjectType a")
        if len(htmlPq) == 0:
            entity = name + ',' + sub_name + ',' + sub_name + ',' + sub_ename + '\n'
            fw.write(entity)

        for i in range(len(htmlPq)):
            min_name = htmlPq.eq(i).text().encode('utf8')
            tmp = htmlPq.eq(i).attr['href'].split('/')
            if len(tmp) < 4:
                continue
            min_ename = tmp[3].encode('utf8')
            entity = name + ',' + sub_name + ',' + min_name + ',' + min_ename + '\n'
            fw.write(entity)
        time.sleep(3)
    fr.close()
    fw.close()


def main():
    get_category()
    get_sub_category()
    get_min_category()

main()

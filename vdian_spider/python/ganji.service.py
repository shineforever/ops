#coding:utf8

from pyquery import PyQuery as pq
import urllib2
import time


URL = 'http://bj.ganji.com'


def get_category():
    category = []
    html = urllib2.urlopen(URL + '/huangye/').read()
    htmlPq = pq(html)("#wrapper div.left-nav-list div.item");
    fw = open('ganji.service.txt', 'w')
    for i in range(len(htmlPq)):
        cat1_pq = htmlPq.eq(i)('p.tit.fb a')
        cat1_name = cat1_pq.text()
        cat2_pq = htmlPq.eq(i)('div.s-class dl')
        for j in range(len(cat2_pq)):
            cat2_name = cat2_pq.eq(j)("dt a").text()
            cat2_ename = cat2_pq.eq(j)("dt a").attr['href'].strip('/')
            entity = '1,' + cat2_name + ',' + u'全部,' + cat2_ename + '\n'
            fw.write(entity.encode('utf8'))
            cat3_pq = cat2_pq.eq(j)("dd a")
            for k in range(len(cat3_pq)):
                cat3_name = cat3_pq.eq(k).text()
                cat3_ename = cat3_pq.eq(k).attr['href'].strip('/')
                entity = '2,' + cat2_name + ',' + cat3_name + ',' + cat3_ename + '\n'
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
    #get_sub_category()
    #get_min_category()

main()

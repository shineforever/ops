#coding:utf8

import urllib2
import time
import json
from pyquery import PyQuery as pq


URL = 'http://bj.ganji.com'


def get_category():
    category = []
    html = urllib2.urlopen(URL + '/ershouche/').read()
    htmlPq = pq(html)("#seltion div.seltion-cont dl.selitem.lh24.clearfix").eq(0)("a");
    fw = open('category4.txt', 'w')
    for i in range(1, len(htmlPq)):
        url = htmlPq.eq(i).attr['href']
        cname = htmlPq.eq(i).text()
        entity = cname + ',' + url + '\n'
        fw.write(entity.encode('utf8'))
    fw.close()

def get_sub_category():
    fr = open('category4.txt', 'r')
    fw = open('category5.txt', 'w')
    for line in fr:
        (name, url) = line.strip().split(',')
        print 'processing ', name
        html = urllib2.urlopen(URL + url).read()
        htmlPq = pq(html)
        script = htmlPq('script:contains("window.PAGE_CONFIG.__hash__")').text()
        hash = script.split("'")[-2]
        ajax_url = "http://bj.ganji.com/ajax.php?dir=vehicle&module=getNewLetterMajorCategory&url=%s&__hash__=%s"
        ajax_url = ajax_url % (url, hash)
        time.sleep(2)
        json_string = urllib2.urlopen(ajax_url).read()
        data = json.loads(json_string)
        for alpha in data:
            for beta in data[alpha]:
                entity = name + ',' + data[alpha][beta]['title'].encode('utf8') + ',' + data[alpha][beta]['url'].encode('utf8') + '\n'
                fw.write(entity)
        time.sleep(3)
    fr.close()
    fw.close()

def get_min_category():
    fr = open('category5.txt', 'r')
    fw = open('category6.txt', 'w')
    for line in fr:
        (name, sub_name, url) = line.strip().split(',')
        print 'processing ', name, sub_name

        #html = urllib2.urlopen("http://bj.58.com/baomacar").read()
        html = urllib2.urlopen(URL + url).read()
        htmlPq = pq(html)

        atags = htmlPq("dl.selitem.lh24.selitem-area.clearfix.js-tag-show dd.posrelative a")
        for i in range(len(atags)):
            if atags.eq(i).text() == u"不限" or atags.eq(i).text() == u"更多":
                continue
            else:
                min_name = atags.eq(i).text().encode('utf8')
                min_ename = atags.eq(i).attr['href']
                entity = name + ',' + url + ',' + sub_name + ',' + min_name + ',' + min_ename + '\n'
                fw.write(entity)
        time.sleep(3)

    fr.close()
    fw.close()

def get_pinyin():
    fr1 = open('category1.txt', 'r')
    fr3 = open('category3.txt', 'r')
    fw = open('ganji.ershouche.txt', 'a')
    name_dic = {}
    for line in fr1:
        name, ename = line.strip().split(',')
        name_dic[name] = ename
    for line in fr3:
        (name, sub_name, min_name, url) = line.strip().split(',')
        min_pinyin = url.split('/')[1]
        if name in name_dic:
            entity = name + ',' + sub_name + ',' + min_name + ',' + name_dic[name] + ',' + min_pinyin + '\n'
            fw.write(entity)
    fr1.close()
    fr3.close()
    fw.close()



def main():
    #get_category()
    #get_sub_category()
    get_min_category()
    #get_pinyin()


if __name__ == "__main__":
    main()

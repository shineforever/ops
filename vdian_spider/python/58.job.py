#coding:utf8

import urllib2
import time
import json
from pyquery import PyQuery as pq


URL = 'http://bj.58.com'


def get_category():
    category = []
    html = urllib2.urlopen(URL + '/job.shtml').read()
    htmlPq = pq(html)("div.posExp.bor.clearfix dl");
    fw = open('58.job12.txt', 'w')
    for i in range(len(htmlPq) - 1):
        cat1_name = htmlPq.eq(i)("dt a").text()
        cat1_ename = htmlPq.eq(i)("dt a").attr['href'].strip('/')
        entity = '1,' + cat1_name + u',全部' + ',' + cat1_ename + '\n'
        fw.write(entity.encode('utf8'))

        dd = htmlPq.eq(i)("dd a")
        for j in range(len(dd)):
            cat2_name = dd.eq(j).text()
            cat2_ename = dd.eq(j).attr['href'].strip('/')
            entity = '2,' + cat1_name + ',' + cat2_name + ',' + cat2_ename + '\n'
            fw.write(entity.encode('utf8'))
    fw.close()

def get_sub_category():
    fr = open('category1.txt', 'r')
    fw = open('category2.txt', 'w')
    for line in fr:
        (name, url) = line.strip().split(',')
        print 'processing ', name
        html = urllib2.urlopen(url).read()
        htmlPq = pq(html)("#data1")
        json_string = htmlPq.attr['value'].replace("'", '"')
        data = json.loads(json_string)
        for car_info in data:
            entity = car_info['text'].encode('utf8') + ',' + car_info['url'].encode('utf8') + '\n'
            fw.write(entity)
        time.sleep(3)
    fr.close()
    fw.close()

def get_min_category():
    fr = open('category2.txt', 'r')
    fw = open('category3.txt', 'w')
    for line in fr:
        target = "http://api.58.com/comm/cmcs/all/all/cityid-1/cateid-29/?api_marktarget=false&api_listname=%s&api_retparameterid=5867&api_callback=jsonp9228&api_type=json"
        (name, sub_name, url) = line.strip().split(',')
        pinyin = url.split('/')[-2]
        target = target % pinyin
        print 'processing ', name, sub_name

        #html = urllib2.urlopen("http://bj.58.com/baomacar").read()
        html = urllib2.urlopen(url).read()
        htmlPq = pq(html)

        string = htmlPq("#carSeriesMore").text()
        if not string:
            print 'not much', name, sub_name
            selection = htmlPq("#selection dl.secitem ")

            blank_flag = 1
            for i in range(len(selection)):
                if selection("dt.secitem_brand").eq(i).text() == u"车系：":
                    blank_flag = 0
                    atag = selection.eq(i)("dd a")
                    for i in range(1, len(atag)):
                        min_name = atag.eq(i).text().encode('utf8')
                        min_url = atag.eq(i).attr['href']
                        min_ename = min_url.split('/')[-2]
                        entity = name + ',' + sub_name + ',' + min_name + ',' + min_ename + '\n'
                        fw.write(entity)
            if blank_flag:
                print 'no brand'
                entity = name + ',' + sub_name + ',' + sub_name + ',' + pinyin + '\n'
                fw.write(entity)
            #return
            time.sleep(3)
            continue
        html = urllib2.urlopen(target).read()
        json_data = html[10:-1]
        data = json.loads(json_data)
        data = data['comms_getcmcsinfo'][0]['allpropertys']['allproperty'][0]['propertyvalues']

        for da in data:
            min_name = da['text'].encode('utf8')
            min_ename = da['listname'].encode('utf8')
            entity = name + ',' + sub_name + ',' + min_name + ',' + min_ename + '\n'
            fw.write(entity)
        time.sleep(3)
    fr.close()
    fw.close()


def main():
    get_category()
    #get_sub_category()
    #get_min_category()


if __name__ == "__main__":
    main()

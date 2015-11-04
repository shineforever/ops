# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
from pyquery import PyQuery as pq
import time
import sys

reload(sys)
sys.setdefaultencoding("utf-8")

DP_CITY_LIST_URL = 'http://t.dianping.com/citylist'
DP_HOTEL_URL = 'http://t.dianping.com/hotel/'

# 获取点评的城市code


def get_city_list(url):
    """返回点评团购酒店业务所有的城市, 放在一个文件中， 中间用制表符分割"""
    print "get city list start..."
    request = urllib2.Request(url, headers={'User-Agent': 'Magic Browser'})
    citylist_html = urllib2.urlopen(request).read()
    # print citylist_html # return chinese is right
    py_cl_html = pq(unicode(citylist_html))(".cityes-list a")
    fw = open('../result/dp/dp_city_code.txt', 'w+')
    for i in range(0, len(py_cl_html)):
        city_pinyin = py_cl_html.eq(i).attr['href'].strip('/')
        city_name = py_cl_html.eq(i).text()
        entity = city_pinyin+", "+city_name+"\n"
        fw.write(entity)
    fw.close()
    print "end city list end"


def get_area_list():
    """根据城市来获取城市的行政区的url"""
    area_part_url = '#classify-tab|0|2'
    fr = open('../appdata/dp_city.txt', 'r')
    fw = open('../result/dp/dp_city_area_url.txt', 'w+')
    for line in fr:
        if line.__contains__('qita,'):
            continue
        (cityid, cityname, citypy) = line.strip().split(',')
        try:
            url_city = DP_HOTEL_URL+citypy+area_part_url
            print "processing : "+cityname
            request = urllib2.Request(url_city, headers={'User-Agent': 'Magic Browser'})
            page = urllib2.urlopen(request)
            html_content = page.read()
            # response content process
            area_pq = pq(unicode(html_content, 'utf-8'))('div[data-id="classify-group"] ul')
            print 'regions: %d' % area_pq.length
            for i in range(1, 2):
              area_py_p = area_pq.eq(i)('a')
              for j in range(0, len(area_py_p)):
                  area_name = area_py_p.eq(j)('span').text()
                  area_url = area_py_p.eq(j).attr['href']
                  record = '%s, %s, %s ' % (cityname, area_name, area_url)
                  fw.write(record+"\n")
            time.sleep(3)
        except Exception, e:
            print e
    fr.close()
    fw.close()
    print 'end'

DP_GROUP_URL = "http://t.dianping.com"


def get_deal_url_list():
    """根据url获取单子url"""
    fr = open('../result/dp/dp_city_area_url.txt', 'r')
    fw = open('../result/dp/dp_hotel_deal_url.txt', 'w+')
    for line in fr:   # area url
        (city, city_area, hotel_deal_url) = line.strip().split(',')
        city_add = city+city_area
        print 'processing : '+city_add
        deal_url = DP_GROUP_URL + str(hotel_deal_url).strip()
        fw.write(city_add+","+deal_url+"\n")
        request = urllib2.Request(deal_url, headers={'User-Agent': 'Magic Browser'})
        try:
            page = urllib2.urlopen(request).read()

            # judge page is char
            if isinstance(page, str):
                page = unicode(page, encoding='utf-8')

            deal_pq = pq(page)('.tg-paginator-wrap a')
            max_num = 0
            for i in range(1, len(deal_pq)):
                page_num = deal_pq.eq(i).attr['data-page'].strip()
                if max_num < int(page_num):
                    max_num = int(page_num)
            page_url_p = '&pageIndex='
            for j in range(1, max_num):
                temp_url = deal_url+page_url_p+str(j).strip()
                fw.write(city_add+","+temp_url+"\n")
        except BaseException, e:
            print e.message

    fr.close()
    fw.close()


def get_detailed_info():
    fr = open('../result/dp/dp_hotel_deal_url.txt', 'r')
    path = '../result/dp/dp_hotel_deal_info'+time.strftime('%Y_%m_%d', time.localtime(time.time()))+".txt"
    fw = open(path, 'w+')
    for line in fr:
        (city_address, deal_url) = line.strip().split(',')
        request = urllib2.Request(deal_url.strip(), headers={'User-Agent': 'Magic Browser'})
        try:
            page = urllib2.urlopen(request).read()
            # judge page is char
            if isinstance(page, str):
                page = unicode(page, encoding='utf-8')
            page_pq = pq(page)('.tg-floor-item')
            print 'processing : '+city_address
            for i in range(0, len(page_pq)):
                hotel_deal_id = page_pq.eq(i)('.tg-floor-title').attr['href']
                hotel_deal_id = hotel_deal_id.strip()[12:]
                hotel_name = page_pq.eq(i)('h3').text()
                hotel_price_old = page_pq.eq(i)('.tg-floor-price-old del').text()
                hotel_price_now = page_pq.eq(i)('.tg-floor-price-new em').text()
                sales_quantity = page_pq.eq(i)('.tg-floor-soldnum').text()
                if len(sales_quantity) == 0:
                    sales_quantity = '已售0'
                sales_quantity = sales_quantity.decode('utf8')[2:].encode('utf8')
                hotel_desc = page_pq.eq(i)('h4').text()
                hotel_comment = page_pq.eq(i)('.tg-floor-comment').text()
                if len(hotel_comment) == 0:
                    hotel_comment = '0条评价'
                hotel_comment = hotel_comment.strip().decode('utf8')[:-3].encode('utf8')
                entity = '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' % (hotel_deal_id, hotel_name, hotel_price_old,
                                                               hotel_price_now, sales_quantity, hotel_comment,
                                                               ''.join(hotel_desc.split()),
                                                               time.strftime('%Y-%m-%d', time.localtime(time.time())))
                fw.write(entity)
        except BaseException, e:
            print e.message
        time.sleep(2)
    fr.close()
    fw.close()


def main():
    print "process area list"
    get_area_list()  # 获取一个城市的各个行政区的url
    print '--------- GET AREA DONE --------------'
    #get_deal_url_list()  # 获取一个行政区的酒店单子
    print '--------- GET DEAL URL DONE --------------'
    #get_detailed_info()  # 获取详细的信息
    print '--------- GET DEAL INFO DONE --------------'


if __name__ == '__main__':
    main()

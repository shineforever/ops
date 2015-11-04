# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
from pyquery import PyQuery as pq
import time
import sys

reload(sys)
sys.setdefaultencoding("utf-8")

def get_goods_category_url():
    """团购商品各个城市分类url"""
    goods_url = 'http://t.dianping.com/goods/'
    fr = open('../appdata/dp_city.txt', 'r')
    fw = open('../result/dp/dp_goods_urls.txt', 'w+')
    for line in fr:
        (city_id, city_name, city_py) = line.strip().split(',')
        print 'processing : '+city_name
        city_goods_url = goods_url.strip()+city_py
        city_goods_request = urllib2.Request(city_goods_url, headers={'User-Agent': 'Magic Browser'})
        try:
            goods_page = urllib2.urlopen(city_goods_request).read()
            if isinstance(goods_page, str):
               goods_page = unicode(goods_page, 'utf8')
            goods_page_pq = pq(goods_page)('.goods-nav-list a')
            for i in range(1, len(goods_page_pq)):
                good_cat_name = goods_page_pq.eq(i).text()
                good_cat_name = ''.join(good_cat_name.split())
                good_cat_url = goods_page_pq.eq(i).attr['href'].strip()
                entity = '%s,%s,%s\n' % (city_name, good_cat_name, good_cat_url)
                fw.write(entity)
        except BaseException, e:
            print e.message
        time.sleep(1)
    fw.close()
    fr.close()
    print '-----Get First Level Done------'


def get_good_cat_page_url():
    """团购商品详细url"""
    dp_url = 'http://t.dianping.com'
    fr = open('../result/dp/dp_goods_urls.txt', 'r')
    fw = open('../result/dp/dp_goods_all_url.txt', 'w+')
    for line in fr:
        (city_name, city_cat_name, city_cat_url) = line.strip().split(',')
        detail_cat = city_name + city_cat_name
        print 'processing :' + detail_cat
        url = dp_url.strip()+city_cat_url.strip()
        request = urllib2.Request(url, headers={'User-Agent': 'Magic Browser'})
        try:
            deal_list_page = urllib2.urlopen(request).read()
            if isinstance(deal_list_page, str):
                deal_list_page = unicode(deal_list_page, 'utf8')
            deal_list_page_pq = pq(deal_list_page)('.pages-wrap a')
            max_page_num = 0
            for i in range(0, len(deal_list_page_pq)):
                page_num = deal_list_page_pq.eq(i).attr['data-pg']
                page_num = int(page_num)
                if page_num > max_page_num:
                    max_page_num = page_num
            for j in range(2, max_page_num+1):
                temp_url = url[0:-11] + '?pageno=' + `j` +url[-11:]
                entity = '%s,%s,%s\n' % (city_name, city_cat_name, temp_url)
                fw.write(entity)
        except BaseException, e:
            print e.message
        time.sleep(1)
    fr.close()
    fw.close()
    print '-------GET All url Done-------'


def get_goods_info():
    """商品详细情况"""
    fr = open('../result/dp/dp_goods_all_url.txt', 'r')
    path = '../result/dp/dp_goods_info_'+time.strftime('%Y_%m_%d', time.localtime(time.time()))+".txt"
    fw = open(path, 'w+')
    for line in fr:
        (city_name, category, category_url) = line.strip().split(',')
        print 'processing : '+city_name+" goods category : "+category
        try:
            request = urllib2.Request(category_url, headers={"User-Agent": "Magic Browser"})
            deal_list_page = urllib2.urlopen(request).read()
            if isinstance(deal_list_page, str):
                deal_list_page = unicode(deal_list_page, 'utf8')
            deal_list_page_pq = pq(deal_list_page)('.floor-item a')
            for i in range(0, len(deal_list_page_pq)):
                index = deal_list_page_pq.eq(i)
                deal_id = index.attr['href']
                deal_id = deal_id[6:]
                deal_title = index('h3').text().strip().replace('\t','')
                deal_desc = index('h4').text().strip().replace('\t','')
                deal_price_now = index('h5 em').text().strip()
                deal_price_old = index('h6 em').text().strip()
                sales_quantity = index('.buy em').text().strip()
                entity = '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' % (city_name, category, deal_id, deal_title,
                                                                   deal_price_old, deal_price_now, sales_quantity,
                                                                   deal_desc, time.strftime('%Y-%m-%d', time.localtime(time.time())))
                fw.write(entity)
            time.sleep(1)
        except BaseException, e:
            print e.message
    fr.close()
    fw.close()
    print '----Deal Info Crawl Done'


def main():
    """Main"""
    get_goods_category_url()
    get_good_cat_page_url()
    get_goods_info()
if __name__ == '__main__':
    main()
 

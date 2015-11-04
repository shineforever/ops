# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
import time
from pyquery import PyQuery as pq
import os
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

URL = r'http://beijing.qfang.com/sale/'


def get_url_day(url):
    """返回当天更新数量的url"""
    ids_list = []
    fw = open('../result/qfang/urls_the_day.txt', 'w')
    is_today = 0
    max_page = 0
    index = int(1)
    is_f = True
    while is_today == 0:
        if is_f:
            houses_page = urllib2.urlopen(url).read()
        else:
            if index < max_page:
                index += 1
            p_url = url+'/f'+str(index)
            print p_url
            try:
                houses_page = urllib2.urlopen(p_url).read()
            except urllib2.URLError, e:
                e.reason
                time.sleep(2)
                houses_page = urllib2.urlopen(p_url).read()
        # is_f = False
        if isinstance(houses_page, str):
            houses_page = unicode(houses_page, 'utf-8')
        if max_page == 0:
            page_number_pq = pq(houses_page)('.turnpage_num a')
            for j in range(len(page_number_pq)-1, ):
                temp = page_number_pq.eq(j).text().strip()
                if max_page < int(temp):
                    max_page = int(temp)
            is_f = False
            print '--------Max page is : '+str(max_page)+'----------'
        houses_pq = pq(houses_page)('.cycle-listings li')
        for i in range(0, len(houses_pq)):
            part_url = houses_pq.eq(i)('p a').attr['href']
            (none, sale, house_sale_id) = str(part_url).strip().split('/')
            update_str = houses_pq.eq(i)('.listings-item-bottom p').text()
            if isinstance(update_str, str):
                update_str = unicode(update_str, 'utf-8')
            # print update_str.encode('utf-8')
            update_str = update_str.strip().split()[1]
            entity = ''
            if str(update_str).__contains__(u'分钟'):
                entity = '%s\n' % house_sale_id
            elif str(update_str).__contains__(u'小时'):
                update_hour = int(update_str[0: update_str.index(u'小时')])
                current_hour = int(time.strftime('%H', time.localtime(time.time())))
                if (current_hour - update_hour) > 0:
                    entity = '%s\n' % house_sale_id
                else:
                    is_today = -1
            else:
                is_today = -1
                break
            if not len(entity) == 0:
                print house_sale_id+" , " + update_str
                ids_list.append(entity)
                fw.write(entity)
        time.sleep(0.5)
    fw.close()
    return ids_list


def get_info(city_url, ids_url):
    """根据house sale id 找到具体需要的信息"""
    path = '../result/qfang/q_fang_info_'+time.strftime('%Y_%m_%d', time.localtime(time.time()))+'.txt'
    fw = open(path, 'w+')
    for sale_id in ids_url:
        detail_url = city_url.strip()+sale_id.strip()
        # print detail_url
        try:
            detail_page = urllib2.urlopen(detail_url).read()
        except urllib2.URLError, e:
            e.reason
            time.sleep(2)
            detail_page = urllib2.urlopen(detail_url).read()
        if isinstance(detail_url, str):
            detail_page = unicode(detail_page, 'utf-8')
        house_id = pq(detail_page)('.house_number span').text().strip()
        if len(house_id) == 0:
            continue
        broker_name = pq(detail_page)('.broker_basic_name').text().strip()
        broker_tel = pq(detail_page)('.mtel_num').text().strip()
        release_time = pq(detail_page)('.release_time').text().strip()
        store_info = pq(detail_page)('.store_info')
        store_add = ''
        for i in range(0, len(store_info)):
            temp = store_info.eq(i).text().strip()
            store_add = store_add + ' - '+temp
        entity = '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' % (sale_id.strip('\n'), house_id, broker_name, broker_tel, store_add,
                                                   release_time,
                                                   time.strftime('%Y-%m-%d', time.localtime(time.time())))
        print sale_id
        fw.write(entity)
    fw.close()


def main():
    """main"""
    bj = r'http://beijing.qfang.com/sale/'  # 单独跑北京花费时间：277 (s)
    # sz = r'http://shanghai.qfang.com/sale/'  # 请求过于频繁造成请求拥堵， 通过catch然后再次发送请求， 如果被server端禁止了ip那就需要另一套解决方案了
    citys = []
    for arg in range(1, len(sys.argv)):
        temp = r'http://'+sys.argv[arg]+r'.qfang.com/sale/'
        citys.append(temp)
    if not os.path.isdir('../result/qfang'):
        os.makedirs('../result/qfang')
    start_time = datetime.datetime.now()
    for city_url in citys:
        ids_list = get_url_day(city_url)
        get_info(city_url, ids_list)
    end_time = datetime.datetime.now()
    print "花费时间：%s (s)" % (end_time-start_time).seconds
if __name__ == '__main__':
    main()
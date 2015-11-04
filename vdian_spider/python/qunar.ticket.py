#!/usr/bin/env python
# -*- coding:utf-8 -*-

__author__ = 'xiaoghu@cisco.com'


import re
import multiprocessing as mp
import codecs
import time
import ipaddr
import datetime
import os
import random
import traceback
from selenium import webdriver
from selenium.webdriver.common.proxy import *
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
import time
from selenium.webdriver.common.by import By


short_hot_city_list = [u'长春', u'太原', u'南昌', u'丽江']
hot_city_list = [u'上海', u'北京', u'广州', u'昆明', u'西安', u'成都' ,u'深圳', u'厦门', u'乌鲁木齐', u'南京', u'重庆', u'杭州',
              u'大连', u'长沙', u'海口', u'哈尔滨', u'青岛', u'沈阳', u'三亚', u'济南', u'武汉', u'郑州', u'贵阳', u'南宁',
              u'福州', u'天津', u'长春', u'太原', u'南昌', u'丽江']

grade_1_city_list = [u'北京', u'上海', u'广州', u'深圳']
grade_2_city_list = [u'沈阳', u'天津', u'太原', u'西安', u'呼和浩特', u'西宁', u'成都', u'武汉', u'南宁', u'杭州']
grade_3_city_list = [u'青岛', u'大连', u'厦门', u'保定', u'常州', u'佛山', u'抚顺', u'桂林', u'嘉兴', u'九江', u'开封',
                     u'连云港', u'丽江', u'马鞍山', u'绵阳', u'宁波', u'秦皇岛', u'泉州', u'汕头', u'十堰', u'温州', u'无锡',
                     u'扬州', u'烟台', u'吉林', u'包头', u'珠海', u'株洲', u'徐州', u'汉中']

hotel_city = grade_1_city_list + grade_2_city_list + grade_3_city_list

hotel_type_list = [u'经济型', u'二星级', u'三星级', u'四星级', u'五星级']

site = 'http://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=%E5%8C%97%E4%BA%AC&searchArrivalAirport=%E4%B8%8A%E6%B5%B7&searchDepartureTime=2015-05-07&searchArrivalTime=2015-05-10&nextNDays=0&startSearch=true&fromCode=BJS&toCode=SHA&from=fi_re_search&lowestPrice=null'

date = '2015-05-07'


def one_driver_all_ticket():
    driver = webdriver.Firefox()
    driver.get(site)

    num = len(hot_city_list)
    # num = 2
    doneArr = os.listdir("../result/qunar_flight/");
    doneDict = {}
    doneCount=0
    for f in doneArr:
        vals = f.split(',')
        dep=vals[0]
        arr=vals[1].replace('2014-10-01','')
        key= unicode(dep+'-'+arr,'utf-8')
        doneDict[key] = True
        doneCount+=1
        pass
    print "%d flights done." % doneCount
    for i in xrange(num):
        for j in xrange(num):
            from_city = hot_city_list[i]
            to_city = hot_city_list[j]
            if from_city == to_city:
                continue
            key=from_city+'-'+to_city
            if key in doneDict:
                continue
            one_driver_ticket(driver, from_city, to_city)
        pass
    driver.close()
    pass


def one_driver_ticket(driver, from_city, to_city):
    # driver = webdriver.Firefox()
    # t = datetime.datetime.now()
    # site = 'http://flight.qunar.com'
    driver.find_element_by_name('fromCity').clear()
    driver.find_element_by_name('fromCity').send_keys(from_city)
    driver.find_element_by_name('toCity').clear()
    driver.find_element_by_name('toCity').send_keys(to_city)
    driver.find_element_by_name('fromDate').clear()
    driver.find_element_by_name('fromDate').send_keys(date)
    driver.find_element_by_css_selector('button.btn_sch').click()

    flag = True
    page_num = 0

    while flag:
        next_page = None
        prev_page = None
        time.sleep(random.randint(5, 12))

        try:
            if driver.find_element_by_css_selector('div.msg'):
                # time.sleep(1)
                print "等待输入验证码\n"
                continue
                pass
        except Exception as e:
            pass

        try:
            next_page = driver.find_element_by_css_selector('a#nextXI3')
            prev_page = driver.find_element_by_css_selector('a#prevXI3')
            pass
        except Exception as e:
            pass

        # print "page: %d" % (page_num + 1)
        # print 'next_page: %s\n, prev_page:%s\n' % (str(next_page), str(prev_page))

        elem = driver.find_element_by_xpath("//*")
        source_code = elem.get_attribute("outerHTML")
        # print type(source_code)
        f = codecs.open(u'../result/qunar_flight/' + from_city + u',' + to_city + unicode(date) + u',' + unicode(str(page_num+1)) + u'.html',
                        'w+',
                        'utf8')
        f.write(source_code)
        f.close()

        if next_page:
            try:
                next_page.click()
                page_num += 1
                pass
            except Exception as e:
                # driver.close()
                print 'next_page could not be clicked'
                print e
                print traceback.format_exc()
                flag = False
                pass
            pass
        else:
            flag = False
        pass

    # try:
    #     driver.close()
    #     pass
    # except Exception as e:
    #     pass
    pass


def one_driver_hotel(city):
    pass


def ticket_worker(city_proxy):
    city = city_proxy.split(',')[0]
    proxy = city_proxy.split(',')[1]

    proxy = Proxy({
        'proxyType': ProxyType.MANUAL,
        'httpProxy': proxy,
        'ftpProxy': proxy,
        'sslProxy': proxy,
        'noProxy': ''   #过滤不需要代理的地址
    })

    driver = webdriver.Firefox(proxy=proxy)
    driver.get(site)

    num = len(hot_city_list)
    # num = 2

    for i in xrange(num):
        if city == hot_city_list[i]:
            continue
        from_city = city
        to_city = hot_city_list[i+1]
        one_driver_ticket(driver, from_city, to_city)
        one_driver_ticket(driver, to_city, from_city)
        pass
    driver.close()
    pass


def get_proxy_list(file_path):
    proxy_list = []
    try:
        f = open(file_path, 'r')
        all_lines = f.readlines()
        for l in all_lines:
            proxy_list.append(l.replace('\r', '').replace('\n', ''))
            pass
        f.close()
        pass
    except Exception as e:
        print e
        print traceback.format_exc()
        pass

    return proxy_list
    pass


def all_ticket():
    """
    请您输入验证码
    """
    city_proxy_list = []

    proxy_list = get_proxy_list('../proxy/proxy.20140228.txt')

    for i in range(len(hot_city_list)):
        city_proxy_list.append(hot_city_list[i]+','+proxy_list[i])

    process_num = len(hot_city_list)
    pool = mp.Pool(processes=process_num)
    pool.map(ticket_worker, city_proxy_list)
    pool.close()
    pool.join()
    pass


def main():
    # all_ticket()
    one_driver_all_ticket()
    pass


if __name__ == '__main__':
    print "start"
    main()
    print "finished"
    pass

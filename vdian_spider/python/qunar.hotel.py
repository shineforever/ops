#!/usr/bin/env python
# -*- coding:utf-8 -*-

__author__ = 'xiaoghu@cisco.com'

import os
import re
import urllib
import multiprocessing as mp
import codecs
import time
import datetime
import traceback
from selenium import webdriver
from selenium.webdriver.common.proxy import *
from selenium.common.exceptions import TimeoutException
#from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC
import time
from selenium.webdriver.common.by import By

fromDate = '2015-07-30'
toDate = '2015-07-31'

firsttime = True
# city_map = {
#     u'北京': 'beijing_city',
#     u'上海': 'shanghai_city',
#     u'丽江': 'lijiang',
#     u'九江': 'jiujiang',
#     u'佛山': 'foshan',
#     u'包头': 'baotou',
#     u'厦门': 'xiamen',
#     u'吉林': 'jilin',
#     u'大连': 'dalian',
#     u'宁波': 'ningbo',
#     u'常州': 'changzhou',
#     u'广州': 'guangzhou',
#     u'徐州': 'xuzhou',
#     u'成都': 'chengdu',
#     u'无锡': 'wuxi',
#     u'杭州': 'guizhou',
#     u'桂林': 'guilin',
#     u'武汉': 'wuhan',
#     u'汉中': 'hanzhong',
#     u'沈阳': 'shenyang',
#     u'深圳': 'shenzhen',
#     u'温州': 'wenzhou',
#     u'烟台': 'yantai',
#     u'西安': 'xian',
#     u'青岛': 'qingdao',
#     u'秦皇岛': 'qinhuangdao',
#     u'连云港': 'lianyungang',
#     u'呼和浩特': 'huhehaote'
# }

city_map = {
    '北京': 'beijing_city',
    '上海': 'shanghai_city',
    '丽江': 'lijiang',
    '九江': 'jiujiang',
    '佛山': 'foshan',
    '包头': 'baotou',
    '厦门': 'xiamen',
    '吉林': 'jilin',
    '大连': 'dalian',
    '宁波': 'ningbo',
    '常州': 'changzhou',
    '广州': 'guangzhou',
    '徐州': 'xuzhou',
    '成都': 'chengdu',
    '无锡': 'wuxi',
    '杭州': 'guizhou',
    '桂林': 'guilin',
    '武汉': 'wuhan',
    '汉中': 'hanzhong',
    '沈阳': 'shenyang',
    '深圳': 'shenzhen',
    '温州': 'wenzhou',
    '烟台': 'yantai',
    '西安': 'xian',
    '青岛': 'qingdao',
    '秦皇岛': 'qinhuangdao',
    '连云港': 'lianyungang',
    '呼和浩特': 'huhehaote'
}

reverse_city_map = dict((v, k) for k, v in city_map.iteritems())


def get_city_hotel_tuple_list():
    city_hotel_tuple_list = []
    doneFiles = os.listdir('../result/ota/qunar_hotel/')
    doneHotels = {}
    for f in doneFiles:
        doneHotels[f.split('-')[1].replace(".html","")]=True
        pass
    
    fp = codecs.open('../appdata/qunarhotels.txt', 'r', 'utf8')
    lines = fp.readlines()
    for l in lines:
        l = l.replace('\r', '').replace('\n', '')
        # city = city_map[l.split(',')[0]]
        vals = l.split(',')
        city = vals[0]
        elongId = vals[1]
        elongHotel = vals[2]
        qunarId = vals[3]
        qunarHotel = vals[4]
        if doneHotels.has_key(qunarId):
            continue
        
        city_hotel_tuple_list.append((city,elongId,elongHotel,qunarId,qunarHotel))
        pass

    return city_hotel_tuple_list
    pass


def one_driver_all_hotel():
    #fp = webdriver.FirefoxProfile("/home/bda/.mozilla/firefox/f6dk7if1.default")

    driver = webdriver.Chrome('/home/bda/chromedriver')#webdriver.Firefox(fp)##
    city_hotel_tuple_list = get_city_hotel_tuple_list()
    #driver.manage().timeouts().pageLoadTimeout(4,TimeUnit.SECONDS);

    num = len(city_hotel_tuple_list)
    
    for i in range(num):
        # city = city_hotel_tuple_list[i][0]
        # hotel = city_hotel_tuple_list[i][1]
        # elongId = city_hotel_tuple_list[i][2]
        # city = city.encode('utf8')
        # hotel = hotel.encode('utf8')
        # print "city: %s, hotel: %s" % (city, hotel)
        one_driver_hotel(driver, city_hotel_tuple_list[i])
        pass
    driver.close()
    pass


def one_driver_hotel(driver, tp):
    city = tp[0]
    elongId = tp[1]
    elongName = tp[2]
    qunarId = tp[3]
    qunarName = tp[4]
    
    print "City: %s, Hotel: %s, Id: %s" % (city,qunarName,qunarId)
    
    vals = tp[3].split("_")
    if len(vals) == 2:
        url = "http://hotel.qunar.com/city/"+vals[0]+"/dt-"+vals[1]+"/?tag="+vals[0]+"#fromDate="+fromDate+"&toDate="+toDate+"&q=&from=qunarindex&fromFocusList=0&filterid=4ce8f434-5c34-4edb-ab40-731891d8e206_A&showMap=0&qptype=&QHFP=ZSS_A479F428"
    else:
        c=vals[0]+"_"+vals[1]
        url = "http://hotel.qunar.com/city/"+c+"/dt-"+vals[2]+"/?tag="+c+"#fromDate="+fromDate+"&toDate="+toDate+"&q=&from=qunarindex&fromFocusList=0&filterid=4ce8f434-5c34-4edb-ab40-731891d8e206_A&showMap=0&qptype=&QHFP=ZSS_A479F428"
        
    site = 'http://hotel.qunar.com'
    # site = site.replace('%(city)', city).replace('%(hotel)', hotel)     # urllib.quote(hotel))
    # print site
    driver.get(url)
    # try:
    #     driver.find_element_by_name('toCity').clear()
    #     driver.find_element_by_name('toCity').send_keys(city)
    #     driver.find_element_by_name('fromDate').clear()
    #     driver.find_element_by_name('fromDate').send_keys(fromDate)
    #     driver.find_element_by_name('toDate').clear()
    #     driver.find_element_by_name('toDate').send_keys(toDate)
    #     driver.find_element_by_name('q').clear()
    #     driver.find_element_by_name('q').send_keys(hotel)
    #     driver.find_element_by_css_selector('button.btn').click()
    # except Exception as e:
    #     pass
        
    flag = True
    while flag:
        
        try:
            if driver.find_element_by_css_selector('div.msg'):
                print "等待输入验证码\n"
                continue
                pass
        except Exception as e:
            pass

        #try:
            # parentTR =None
            # items = driver.find_elements_by_css_selector(".position_r .c2 h2 a")
            # print len(items)
            # if len(items) > 0:
            #     parentTR = items[0]
            # else:
            # if driver.title != u"非常抱歉，您访问的页面不存在。":
            #     f = codecs.open('../result/ota/qunar_hotel/' + city + '-'+qunarId+'.html','w+','utf8')
            #     f.write(" ")
            #     f.close()
            #     flag=False
            #     continue
            #print "result avaliable"
            #parentTR = driver.find_element_by_xpath("//span[@class='namered']//..")
            #parentTR=driver.find_element_by_xpath("//div[@id='js-singleHotel']/div/div[@class='position_r']/div[@class='c2']/h2/a[1]")
            #parentTR=driver.find_element_by_xpath("//div[@class='b_hlistPanel']/div[@class='e_hlist_item js_list_block'][1]/div[@class='position_r']/div[@class='c2']/h2/a[1]")
            # new_url = parentTR.get_attribute('href')
            # driver.get(new_url)
            
        #    pass
        #except Exception,e:
            # print u'failed: ' + city + qunarName
            # flag=False
            # continue
            # pass

        try:
            if driver.find_element_by_css_selector('div.msg'):
                print "等待输入验证码\n"
                continue
                pass
        except Exception as e:
            pass

        if firsttime :
            global firsttime
            time.sleep(60)
            firsttime=False
        else:
            time.sleep(6)
        # 展开报价
        try:
            # elems = driver.find_elements_by_xpath("//li[@class='defaultpricetype']")

            elems = driver.find_elements_by_css_selector('p.btn-book-ct')
            #print len(elems)
            print "%d rooms need to open price" % roomCountNeedOpen
            for elem in elems:
                txt = elem.find_element_by_tag_name('a').text
                if txt == '展开报价':
                    elem.click()
                    time.sleep(1)
        except Exception as e:
            print "there are no e_prcDetail element"
            pass
#        idList=[]
        try:
            anchors = driver.find_elements_by_css_selector(".js-expand-more")
            #idList = map(lambda l:l.get_attribute("id"),filter(lambda l:l.get_attribute("class").find("similar-expand")<0,lis))
            roomCountNeedOpen = len(anchors)
            print "%d rooms need to load more price" % roomCountNeedOpen

            for elem in anchors:
                elem.click()
                time.sleep(1)
        except Exception as e:
            print "something wrong with getting room list"
            pass

        # while len(idList) > 0:
        #     liId = idList.pop()
        #     if liId is None:
        #         continue
                
            #if li.get_attribute('class').find("similar-expand")<0:

            #liId = li.get_attribute("id")
            # aId = liId+"-detailEl"
            
            # try:
            #     driver.find_element_by_id(aId).click()
                #ele = WebDriverWait(driver, 3).until(EC.presence_of_element_located((By.ID,aId)))
                #ele.click()
        #         print "open price detail " , aId
        #     except Exception as e:
        #         print "failed to open price"
        # try:
            #elems = driver.find_elements_by_css_selector('a.btn_openPrc')
            
            #for elem in elems:
            #    elem.find_element_by_tag_name('b')
            #    elem.click()
            #elems = driver.find_elements_by_css_selector('a.icoR_open')
            #time.sleep(1)
            #for e in elems:
            #    e.click();
            #    time.sleep(1)
            #time.sleep(1);
                # classes = elem.get_attribute('class')
                # print classes
                # if not 'e_prcDetail_on' in classes:
                #     elem.click()
            # pass
        # except Exception as e:
        #     print "there are no icoR_open elements"
        #     #print traceback.format_exc()
        #     pass
            
        elem = driver.find_element_by_xpath("//*")
        source_code = elem.get_attribute("outerHTML")
        # print type(source_code)
        f = codecs.open('../result/ota/qunar_hotel/' + city + '-'+ qunarId  + '.html',
                        'w+',
                        'utf8')
        f.write(source_code)
        f.close()
        flag = False
        pass
    pass


def main():
    one_driver_all_hotel()
    #driver = webdriver.Firefox()
    #one_driver_hotel(driver,"北京","北京金鼎弘泰大酒店")
    
    pass


if __name__ == '__main__':
    print "start"
    main()
    print "finished"
    pass

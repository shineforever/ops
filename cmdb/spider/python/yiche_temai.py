#coding:utf8
# encoding: utf-8

import urllib
import urllib2
import time
import json
import time
from pyquery import PyQuery as pq
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

global max_retry_times

max_retry_times = 3

global retry_times

retry_times = 0

url = r'http://mai.bitauto.com/goodslist/beijing'

city_url_prefix = r'http://mai.bitauto.com/ajax/ajaxgetcity.ashx?pid='

list_url_pattern = r'http://mai.bitauto.com/goodslist/%s'

def get_html():
    print u'开始'
    req = urllib2.Request(url)
    html = urllib2.urlopen(req).read()
    text = unicode(html, "utf-8")
    htmlPq = pq(text)("#plistblock")("dd")
    for i in range(len(htmlPq)):
        pid = htmlPq.eq(i)("a").attr["pid"]
        if(int(pid) == 0):
            continue
        print pid
#        if(int(pid) < 31):
#            continue
        city_url = city_url_prefix + pid
        city_req = urllib2.Request(city_url)
        city_html = open_Url(city_req)
        city_text = unicode(city_html, "utf-8")
        city_data = json.loads(city_text)
        for j in range(len(city_data)):
            print "cityid: " + str(j)
            city_name = city_data[j]["CityUrl"]
            list_url = list_url_pattern % city_name
            get_list(list_url)
            list_req = urllib2.Request(list_url)
            list_html = open_Url(list_req)
            list_text = unicode(list_html, "utf-8")
            list_htmlPq = pq(list_text)
            pager = list_htmlPq("#MainContent_uc_pager")("a")
            if(len(pager)>0):
                for k in range(1, len(pager)-1):
                    print "cityid: " + str(j) + " page: " + str(k+1)
                    next_page = pager.eq(k).attr["href"]
                    get_list(next_page)

    print u'结束'

def get_list(list_url):
    print list_url
    req = urllib2.Request(list_url)
    html = open_Url(req)
    text = unicode(html, "utf-8")
    htmlPq = pq(text)
    carlist = htmlPq(".theme_list.list_three300")("li")
    for i in range(len(carlist)):
        detail_url = carlist.eq(i)("a").attr["href"]
        print detail_url
        get_detail(detail_url)

def get_detail(detail_url):
    fw = open('../result/auto/yc.txt', 'a')
    req = urllib2.Request(detail_url)
    html = open_Url(req)
    text = unicode(html, "utf-8")
    htmlPq = pq(text)
    city = htmlPq("#clistblock").text()
    car_style = htmlPq("#h_csname").text()
    shop_htmlPq = htmlPq("div.tm-4s")
    for i in range(len(shop_htmlPq)):
        print i
        shop = shop_htmlPq.eq(i)(".p-tit").text()
        print shop
        car_list = shop_htmlPq.eq(i)("tr")
        for j in range(len(car_list) - 1):
            print "processing car detail %s" % j
            car_detail = car_list.eq(j+1)("td")
            car_type = car_detail.eq(0).text()
            car_market_price = car_detail.eq(2).text()
            car_sale_price = car_detail.eq(4).text()
            info = city + "," + car_style + "," + car_type + "," + car_market_price + "," + car_sale_price + "," + shop + "\n"
            fw.write(info.encode("utf8"))

def open_Url(req):
    global retry_times
    global max_retry_times
    try:
        html = urllib2.urlopen(req).read()
        retry_times = 0
        return html
    except:
        retry_times = retry_times + 1
        if(retry_times >= max_retry_times):
            print "[error]retry_times exceed max_retry_times"
        open_Url(req)

def main():
    get_html()

if __name__ == "__main__":
    main()

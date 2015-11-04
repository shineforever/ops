# _*_ coding: utf-8 _*_

import json
import random
import datetime
import scrapy

from scrapy import Spider
from scrapy import log
from scrapy.http import Request


class MeituanHotelSpider(Spider):
    name = 'meituan_hotel'
    download_delay = 2 + 1 * random.random()

    def __init__(self, start, end):
        self.start = int(start)
        self.end = int(end)

    def start_requests(self):
        fw = open('../../appdata/meituan.hotel.city.txt')
        citys = json.loads(fw.read())
        for city in citys[self.start: self.end]:
            meta = {}
            meta['city'] = city
            meta['page_no'] = 1

            url = "http://www.meituan.com/hotel/getcounterandpois/%s?ci=&co=&sort=&w=&attrs=" % (city['pinyin'])
            meta['url'] = url + "&page=%s"

            yield Request(url=meta['url'] % str(meta['page_no']),callback=self.parse_list, meta=meta)

    def parse_list(self, response):
        meta = response.meta
        city = meta['city']
        city_id, city_code = city['id'], city['acronym']

        today = datetime.date.today()
        ci = today + datetime.timedelta(days=3)
        co = today + datetime.timedelta(days=5)
        ci, co = str(ci), str(co)

        print 'GET: city: %s, page: %d' % (city['name'], meta['page_no'])
        json_string = response.body
        json_data = json.loads(json_string)
        data = json_data.get('data')
        page_total = data.get('pageNav').get('totalPage')
        shop_deal = data.get('poiDealList')
        shop_infos = data.get('poiInfo')
        deal_datas = data.get('dealsData')

        for shop_info in shop_infos:
            shop = {}
            shop['page_num'] = meta['page_no']
            shop['city'] = city['name']
            shop['id'] = unicode(shop_info.get('poiID'))
            shop['name'] = shop_info.get('name').replace(',', ';')
            shop['rate'] = shop_info.get('avgScore')
            shop['rate_num'] = shop_info.get('commentNum')

            shop['deal'] = {}
            deal_ids = shop_deal.get(shop['id']).get('dealIDList')
            for deal_id in deal_ids:
                deal = {}
                deal_data = deal_datas.get(unicode(deal_id))
                deal['price'] = deal_data.get('price')
                deal['shop_price'] = deal_data.get('value')
                deal['title'] = deal_data.get('title').replace(',', ';')

                shop['deal'][deal_id] = deal

            url = "http://%s.meituan.com/shop/roominfo/%s?checkin=%s&checkout=%s&cityid=%s&type=0" % \
                (city_code, shop['id'], ci, co, city_id)
            yield Request(url=url, callback=self.parse_shop, meta={'shop': shop})

        meta['page_no'] += 1
        if meta['page_no'] <= page_total:
            yield Request(url=meta['url'] % str(meta['page_no']), callback=self.parse_list, meta=meta)

    def parse_shop(self, response):
        meta = response.meta
        shop = meta['shop']
        fw = open('../../result/meituan_hotel.txt', 'a')

        print '\tGET: city: %s, page: %d, shop: %s' % (shop['city'], shop['page_num'], shop['name'])
        json_string = response.body
        json_data = json.loads(json_string)
        deal_infos = json_data.get('data')
        for deal_info in deal_infos:
            deal_id = deal_info.get('dealId')
            deal_sale_num = deal_info.get('solds')

            deal = shop['deal'].get(deal_id)
            if deal:
                item = [shop['city'],"酒店","全部",deal_id,deal['price'],deal['shop_price'],deal_sale_num, \
                        shop['id'],shop['rate'],shop['rate_num'],shop['name'],deal['title']]
                for i in range(len(item)):
                    if type(item[i]) is unicode:
                        item[i] = item[i].encode('utf8')
                    elif type(item[i]) is not str:
                        item[i] = str(item[i])
                fw.write(','.join(item) + '\n')
        fw.close()

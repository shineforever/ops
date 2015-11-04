# _*_ coding: utf-8 _*_

import json

from pyquery import PyQuery as pq
from scrapy import Spider, Request


class FddCitySpider(Spider):
    name = 'fdd_city_spider'
    start_urls = ['http://shanghai.fangdd.com/index/index/city']

    def parse(self, response):
        html_pq = pq(response.body_as_unicode())
        citys = html_pq("ul.letter-list span.name a")
        for city in citys:
            meta = {}
            meta['city_name'] = pq(city).text()
            meta['city_pinyin'] = pq(city).attr['href'].split('/')[-1].split('.')[0]
            url = "http://%s.esf.fangdd.com/sale/list" % meta['city_pinyin']

            yield Request(url=url, callback=self.parse_list, meta=meta)
            #return [Request(url=url, callback=self.parse_list, meta=meta)]

    def parse_list(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())
        num = html_pq("em.num").text()
        if num:
            with open('../../appdata/fdd.city.txt', 'a') as fw:
                line = (meta['city_name'] + ',' + meta['city_pinyin'] + ',' + num + '\n').encode('utf8')
                fw.write(line)

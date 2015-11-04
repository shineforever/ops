# _*_ coding: utf-8 _*_

import os
import math

from urlparse import urljoin
from scrapy import Spider, Request
from pyquery import PyQuery as pq


NUM_PER_PAGE = 24


class Auto51(Spider):
    name = 'auto51'
    start_urls = ['http://www.51auto.com/quanguo/search/']

    def parse(self, response):
        html = response.body_as_unicode()
        html_pq = pq(html)

        count = int(html_pq('span.s_count strong').text())
        page_total = int(math.ceil(count / NUM_PER_PAGE))
        print count, page_total
        for i in range(1, page_total + 1):
            url = urljoin(self.start_urls[0], '?page=%d') % i
            yield Request(url, callback=self.parse_list)
            #return [Request(url, callback=self.parse_list)]

    def parse_list(self, response):
        html = response.body_as_unicode()
        html_pq = pq(html)

        lis = html_pq('ul.sr_carlist li')
        for li in lis:
            url = brand = series = config = time = mile = city = price = seller = ''
            zunxuan = zhunxinche = jiancerenzheng = '0'

            price = pq(li)('span.figure').text()

            div = pq(li)('div.sr_cl div.sr_carcn')

            atag = div('a:eq(0)')
            url = atag.attr['href']
            title = atag.attr['title']
            tmp = title.split('[')[0].split()
            if len(tmp) > 2:
                brand = tmp[0]
                series = tmp[1]
                config = ';'.join(tmp[2:])

            p1 = div('p:eq(0)')
            tmp = p1.text().split('|')
            if len(tmp) > 2:
                time = tmp[0].strip()
                mile = tmp[1].strip()
                city = tmp[2].strip()

            seller = pq(li)('div.icon_left a').text()

            p2 = div('p:eq(1)')
            tmp = p2.text()
            if u'尊选二手车' in tmp:
                zunxuan = '1'
            if u'准新车' in tmp:
                zhunxinche = '1'
            if u'检测认证' in tmp:
                jiancerenzheng = '1'


            info = [url,brand,series,config,time,mile,city,price,seller,zunxuan,zhunxinche,jiancerenzheng]
            line = ','.join(info) + '\n'
            result_path = os.path.abspath(__file__).replace('python/ershouche/ershouche/spiders/auto51.py', 'result/auto51.txt')
            fw = open(result_path, 'a')
            fw.write(','.join(info).encode('utf8') + '\n')
            fw.close()

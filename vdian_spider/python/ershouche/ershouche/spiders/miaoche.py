# _*_ coding: utf-8 _*_

import os

from scrapy import Spider, Request
from pyquery import PyQuery as pq


class Miaoche(Spider):
    name = 'miaoche'
    citys = {'beijing': u'北京', 'guangzhou': u'广州', 'dongguan': u'东莞', 'shenzhen': u'深圳'}


    def start_requests(self):
        for city_pinyin in self.citys:
            meta = {}
            meta['city_name'] = self.citys[city_pinyin]
            url = 'http://www.miaoche.com/%s/' % city_pinyin
            #return [Request(url, meta=meta)]
            yield Request(url, meta=meta)

    def parse(self, response):
        meta = response.meta
        url0 = response.url
        html = response.body_as_unicode()
        html_pq = pq(html)

        spans = html_pq('#brand_alpha_scrollbar div.viewport span.name')
        for span in spans:
            brand_id = pq(span).attr['brandid']
            meta['brand_name'] = pq(span).text()
            url = url0 + 'auto/brand/%s.html' % brand_id
            #return [Request(url, callback=self.parse_brand, meta=meta)]
            yield Request(url, callback=self.parse_brand, meta=meta)

    def parse_brand(self, response):
        meta = response.meta
        html = response.body_as_unicode()
        html_pq = pq(html)

        series_dic = {}
        divs = html_pq('#brandseries_list div.brand_series_manu_item.beforeafter.clearboth')
        for div in divs:
            manuname = pq(div)('div.item_key span.manuname').text()
            series_list = pq(div)('span[stat="is_brand_series"]')
            for series in series_list:
                series_id = pq(series).attr['seriesid']
                series_name = pq(series).text()
                series_dic[series_id] = (series_name, manuname)

        divs = html_pq('#spec_recom_common_item_wrap div.spec_recom_common_item')
        for div in divs:
            series_id = pq(div).attr['seriesid']
            name = series_dic.get(series_id)
            if name:
                series_name = name[0]
                manuname = name[1]
                name = pq(div)('p.name.bold').text()
                current_price = pq(div)('p.price span.bold').text().strip(u'￥').replace(',', '')
                original_price = pq(div)('p.price span.gray s').text().strip(u'￥').replace(',', '')

                info = [meta['city_name'], manuname, series_name, name, current_price, original_price]
                result_path = os.path.abspath(__file__).replace('python/ershouche/ershouche/spiders/miaoche.py', 'result/miaoche.txt')
                fw = open(result_path, 'a')
                fw.write(','.join(info).encode('utf8') + '\n')
                fw.close()

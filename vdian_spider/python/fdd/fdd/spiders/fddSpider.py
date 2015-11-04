# _*_ coding: utf-8 _*_

import json
import math

from pyquery import PyQuery as pq
from scrapy import Spider, Request


class FddSpider(Spider):
    name = 'fdd_spider'

    def start_requests(self):
        citys = []
        with open('../../appdata/fdd.city.txt', 'r') as fr:
            for line in fr:
                tmp = line.strip().split(',')
                citys.append(tmp)

        for city in citys:
            meta = {}
            meta['city_name'] = city[0]
            meta['city_pinyin'] = city[1]
            meta['house_num'] = int(city[2])
            meta['page_num'] = 1
            url = "http://%s.esf.fangdd.com/sale/list?o=4&p=%d" % (meta['city_pinyin'], meta['page_num'])

            yield Request(url=url, callback=self.parse_list, meta=meta)
            #return [Request(url=url, callback=self.parse_list, meta=meta)]

    def parse_list(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())

        print '[GET]: ', meta['city_name'], ' page_num: ', meta['page_num']

        atags = html_pq("a.title")
        for atag in atags:
            house_url = pq(atag).attr['href']
            meta['house_id'] = house_url.split('-')[-1]
            url = "http://%s.esf.fangdd.com%s" % (meta['city_pinyin'], house_url)
            yield Request(url=url, callback=self.parse_house_info, meta=meta)
            #return [Request(url=url, callback=self.parse_house_info, meta=meta)]

        next_flag = html_pq("div.pagination a.next")
        if next_flag or meta['page_num'] < meta['house_num'] / 32:
            meta['page_num'] += 1
            url = "http://%s.esf.fangdd.com/sale/list?o=4&p=%d" % (meta['city_pinyin'], meta['page_num'])
            yield Request(url=url, callback=self.parse_list, meta=meta)

    def parse_house_info(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())

        house_id = meta['house_id']
        title = html_pq("#houseName").text().replace(",", ';').replace(' ', ';')
        full_price = html_pq("#flPrice").text().replace(u' 万', '')
        average_price = html_pq("div.price span.weaker-text").text().replace(u'元/平米', '')
        community = html_pq("div.info-hd.info-bd dl.kv.colspan:eq(0) dd.v").text().replace(u' 小区介绍', '')
        publish_time = html_pq("div.real-hs p:eq(0)").text().split(u'：')[-1]
        check_time = html_pq("div.real-hs p:eq(1)").text().split(u'：')[-1]
        view_number = html_pq("div.view-nums em").text()
        subscribe_number = html_pq("div.book-nums em").text()
        comment_number = html_pq("div.dp em").text()
        pic_num = html_pq("em.total-num").text()

        print '\t[GET]: ', meta['city_name'], ' page: ', meta['page_num'], ' house_id: ', house_id

        house_item = [house_id, meta['city_name'], title, full_price, average_price, community, publish_time, check_time, view_number, subscribe_number, comment_number, pic_num]
        with open('../../result/fdd_house.txt', 'a') as fw:
            self.format_item(house_item)
            fw.write(','.join(house_item) + '\n')

        brokers = html_pq("li.agent-infor div.text")
        with open('../../result/fdd_broker.txt', 'a') as fw:
            for broker in brokers:
                broker_info = pq(broker)
                broker_name = broker_info("p b").text()
                if len(broker_info("p").contents()) > 1:
                    broker_company = broker_info("p").contents()[1]
                else:
                    broker_company = ''
                broker_phone = broker_info("span").text().replace(u' 转 ', '-')
                broker_item = [house_id, broker_name, broker_company, broker_phone]
                self.format_item(broker_item)
                if broker_name:
                    fw.write(','.join(broker_item) + '\n')

        meta['page_num'] = 1
        url = "http://%s.esf.fangdd.com/sale/sale/ajax-look-record?sale_id=%s&p=%d&rows=3" % (meta['city_pinyin'], house_id, meta['page_num'])
        yield Request(url=url, callback=self.parse_record, meta=meta)

    def parse_record(self, response):
        meta = response.meta
        json_string = response.body_as_unicode()
        json_data = json.loads(json_string)
        data = json_data.get('data')
        count = data.get('count')
        if count != 0:
            records = data.get('list')
            with open('../../result/fdd_view_record.txt', 'a') as fw:
                for record in records:
                    phone = record.get('tel').replace(u' 转 ', '-')
                    name = record.get('name')
                    company = record.get('company')
                    time = record.get('time')
                    rank = record.get('rank')
                    record_item = [meta['house_id'], name, company, rank, phone, time]
                    self.format_item(record_item)
                    fw.write(','.join(record_item) + '\n')

            page_total = math.ceil(count / 3)
            if meta['page_num'] < page_total:
                meta['page_num'] += 1
                url = "http://%s.esf.fangdd.com/sale/sale/ajax-look-record?sale_id=%s&p=%d&rows=3" % \
                        (meta['city_pinyin'], meta['house_id'], meta['page_num'])
                yield Request(url=url, callback=self.parse_record, meta=meta)

    def format_item(self, item):
        for i in range(len(item)):
            if item[i] is None:
                item[i] = ''
            if type(item[i]) is int:
                item[i] = str(item[i])
            if type(item[i]) is not str:
                item[i] = item[i].encode('utf8')

# _*_ coding: utf-8 _*_

from pyquery import PyQuery as pq
from scrapy import Spider, Request


URL_DOMAIN = 'http://%s.baixing.com'

class BaixingSpider(Spider):
    name = 'baixing_spider'
    download_delay = 0.1
    start_urls = ['http://www.baixing.com/?changeLocation=yes']

    def parse(self, response):
        html_pq = pq(response.body_as_unicode())
        a_tags = html_pq("div.new_cities tr td a")
        for a_tag in a_tags:
            meta = {}
            meta['city_url'] = pq(a_tag).attr['href'].split('.')[0].split('/')[-1]
            #meta['city_url'] = 'ningbo'
            meta['city_name'] = pq(a_tag).text()
            meta['type'] = 0
            meta['url'] = URL_DOMAIN + '/ershouqiche/?cheshang=1&page=%d'
            url = meta['url'] % (meta['city_url'], 1)
            yield Request(url, callback=self.parse_city_page_total, meta=meta)
            #return [Request(url, callback=self.parse_city_page_total, meta=meta)]

    def parse_city_page_total(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())

        page_nums = html_pq("a.pagenav-cell").contents()
        if len(page_nums) >= 2:
            page_total = int(page_nums[-2])
            if page_total == 100:
                if meta['type'] is 0:
                    a_tags = html_pq("div.areas.items a")
                elif meta['type'] is 1:
                    a_tags = html_pq("div.subareas.items a")
                else:
                    a_tags = []

                    meta['page_total'] = page_total
                    meta['page_num'] = 1
                    url = meta['url'] % (meta['city_url'], meta['page_num'])
                    yield Request(url, callback=self.parse_list, meta=meta, dont_filter=True)

                meta['type'] += 1

                for a_tag in a_tags:
                    region_url = pq(a_tag).attr['href'] + '&page=%d'
                    if region_url.startswith('/'):
                        meta['url'] = URL_DOMAIN + region_url
                        meta['page_num'] = 1
                        url = meta['url'] % (meta['city_url'], meta['page_num'])
                        yield Request(url, callback=self.parse_city_page_total, meta=meta, dont_filter=True)

            else:
                meta['page_total'] = page_total
                meta['page_num'] = 1
                url = meta['url'] % (meta['city_url'], meta['page_num'])
                yield Request(url, callback=self.parse_list, meta=meta, dont_filter=True)

        else:
            meta['page_total'] = 1
            meta['page_num'] = 1
            url = meta['url'] % (meta['city_url'], meta['page_num'])
            yield Request(url, callback=self.parse_list, meta=meta, dont_filter=True)

    def parse_list(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())
        lis = html_pq("ul#media li.media.item-regular")
        for li in lis:
            url = pq(li)("a").eq(0).attr['href']
            yield Request(url, callback=self.parse_detail, meta=meta)
            #return [Request(url, callback=self.parse_detail, meta=meta)]

        if meta['page_num'] < meta['page_total']:
            meta['page_num'] += 1
            url = meta['url'] % (meta['city_url'], meta['page_num'])
            yield Request(url, callback=self.parse_list, meta=meta)

    def parse_detail(self, response):
        meta = response.meta
        html_pq = pq(response.body_as_unicode())
        price = brand = model = configuration = milegae = licensing_time = owner = ''

        spans = html_pq("#metadata span.normal")
        for span in spans:
            text = pq(span).text()
            tmp = text.split(u'：')
            if len(tmp) < 2:
                continue
            if tmp[0] == u'价格':
                price = tmp[1].split()[0]
            elif tmp[0] == u'品牌':
                brand = tmp[1].strip()
            elif tmp[0] == u'车系列':
                model = tmp[1].strip()
            elif tmp[0] == u'车型':
                configuration = tmp[1].strip()
            elif tmp[0] == u'上牌年份':
                licensing_time = tmp[1].strip()
            elif tmp[0] == u'行驶里程':
                milegae = tmp[1].strip()

        a_tag = html_pq("a.shop-name") or html_pq("a.userinfo-name")
        owner = a_tag.attr['href'].strip('/').split('/')[-1] or ''
        url = response.url
        city = meta['city_name']
        title = html_pq("h2.viewad-title").contents()[0].strip().replace(u'，', ';').replace(',', ';') or ''

        item = [city, title, brand, model, price, milegae, licensing_time, configuration, owner, url]
        item = [x.encode('utf8') for x in item]
        with open('../../result/baixing_ershouche.txt', 'a') as fw:
            fw.write(','.join(item) + '\n')

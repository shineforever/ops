# _*_ coding: utf-8 _*_

import os

from datetime import datetime
from scrapy import Spider, Request
from pyquery import PyQuery as pq


class Itjuzi(Spider):
    name = 'itjuzi_spider'

    def start_requests(self):
        meta = {}
        meta['page'] = 0
        meta['url'] = 'http://itjuzi.com/company?page=%d'
        url = 'http://itjuzi.com/company?page=%d' % meta['page']
        yield Request(url, callback=self.parse_list, meta=meta)

    def parse_list(self, response):
        meta = response.meta
        html = response.body_as_unicode()
        html_pq = pq(html)

        divs = html_pq('div.company-list.clearfix.childen-hover div.company-list-item')
        for div in divs:
            url = pq(div)('a:eq(0)').attr['href']
            #url = 'http://itjuzi.com/company/21253'
            yield Request(url, callback=self.parse_detail)
            #return [Request(url, callback=self.parse_detail)]

        if u'下一页' in html_pq('div.pagination.pagination-right').text():
            meta['page'] += 1
            url = meta['url'] % meta['page']
            yield Request(url, callback=self.parse_list, meta=meta)

    def parse_detail(self, response):
        meta = response.meta
        html = response.body_as_unicode()
        html_pq = pq(html)

        keys = [u'网址', u'公司', u'时间', u'地点', u'状态', u'阶段', u'行业', u'子行业', u'TAG', u'简介']
        values = ['' for _ in keys]
        team = []
        products = []
        fund_demand = fund_status = ''
        funds = []
        records = []

        project_name = html_pq('#com_id_value').text()
        divs = html_pq('div.normal-box, div.normal-box-no-pad')
        for div in divs:
            h2_text = pq(div)('h2:eq(0)').text()
            if u'基础信息' in h2_text:
                lis = pq(div)('ul.detail-info li')
                for li in lis:
                    key = pq(li).contents()[0]
                    for i in range(len(keys)):
                        if key.startswith(keys[i]):
                            contents = map(lambda x: pq(x).text().replace(',', u'，').replace('\r', '').replace('\n', '').strip() if hasattr(x, 'text') \
                                    else x.replace(',', u'，').replace('\r', '').replace('\n', '').strip(), pq(li).contents())
                            values[i] = ''.join(contents[1:])
            elif u'团队介绍' in h2_text:
                trs = html_pq('#company-member-list-tbl tr')
                for tr in trs:
                    td = pq(tr)('td')
                    name = td.eq(1).text().strip()
                    position = td.eq(2).text().strip()
                    member = '|'.join([name, position]).replace(',', u'，').replace('\r', '').replace('\n', '')
                    team.append(member)
            elif u'产品介绍' in h2_text:
                product_divs = pq(div)('div.company-product-item')
                for product_div in product_divs:
                    product_name = pq(product_div)('h3').text().strip()
                    product_brief = pq(product_div)('p').text().strip()
                    product = '|'.join([product_name, product_brief]).replace(',', u'，').replace('\r', '').replace('\n', '')
                    products.append(product)
            elif u'融资需求' in h2_text:
                fund_demand = pq(div)('#company-fund-status').text()
            elif u'获投状态' in h2_text:
                fund_status = pq(div)('#company-fund-status').text()
                fund_divs = pq(div)('div.company-fund-item')
                for fund_div in fund_divs:
                    fund_time = ''
                    fund_stage = pq(fund_div)('h3 b').text()
                    tmp = pq(fund_div)('h3').contents()
                    if len(tmp) > 1:
                        fund_time = tmp[1].strip()
                    money = pq(fund_div)('p.company-fund-item-money').text()
                    investor = pq(fund_div)('p:eq(1)').text()
                    fund = '|'.join([fund_time, fund_stage, money, investor]).replace(',', u'，').replace('\r', '').replace('\n', '')
                    funds.append(fund)
            elif u'里程碑' in h2_text:
                record_lis = pq(div)('#company-mile li')
                for li in record_lis:
                    time = pq(li)('b').text()
                    description = pq(li)('p').text()
                    record = '|'.join([time, description]).replace(',', u'，').replace(';', u'。').replace('\r', '').replace('\n', '')
                    records.append(record)

        today = datetime.today().strftime('%Y-%m-%d')
        info = [project_name, ','.join(values), response.url, today, ';'.join(team), ';'.join(products), \
                fund_demand, fund_status, ';'.join(funds), ';'.join(records)]
        result_path = os.path.abspath(__file__).replace('python/itjuzi/itjuzi/spiders/itjuzi_spider.py', 'result/itjuzi.txt')
        fw = open(result_path, 'a')
        fw.write(','.join(info).encode('utf8') + '\n')
        fw.close()

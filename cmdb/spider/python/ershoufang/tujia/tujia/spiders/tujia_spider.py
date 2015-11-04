# _*_ coding: utf-8 _*_

import os
import json

from datetime import date, timedelta
from scrapy import Spider, Request, FormRequest
from pyquery import PyQuery as pq


class TujiaSpider(Spider):
    name = 'tujia_spider'
    domain = 'http://www.tujia.com'
    url = 'http://www.tujia.com/%s/ajaxunitsearch/%d/'
    black_list = set([u'香港',
        u'桃园',
        u'苗栗',
        u'花莲',
        u'新北',
        u'高雄',
        u'台南',
        u'宜兰',
        u'台中',
        u'台北',
        u'澎湖',
        u'台东',
        u'新竹',
        u'嘉义',
        u'金门',
        u'南投',
        u'屏东(垦丁)'
    ])
    count = 0

    def start_requests(self):
        city_file = os.path.abspath(__file__).replace(os.path.basename(__file__), 'tujia.city.txt')
        with open(city_file, 'r') as fr:
            text = fr.read()
            citys = eval(text).get('citys')
        for city in citys:
            meta = {}
            meta['city_pinyin'] = city.get('pinyin')
            meta['city_name'] = city.get('name').decode('utf8')
            if meta['city_name'] in self.black_list:
                continue
            meta['page_num'] = 1
            #return [Request(self.url % (meta['city_pinyin'], meta['page_num']), callback=self.parse_list, meta=meta)]
            yield Request(self.url % (meta['city_pinyin'], meta['page_num']), callback=self.parse_list, meta=meta)

    def parse_list(self, response):
        meta = response.meta

        print '[GET] city: %s, page: %d' % (meta['city_name'], meta['page_num'])
        json_data = json.loads(response.body)
        html = json_data.get('unitListHtml')
        html_pq = pq(html)

        divs = html_pq('div.house-list div.searchresult-list')
        for div in divs:
            div = pq(div)
            house_name = div('div.house-name a').text()
            house_url = div('div.house-name a').attr['href']
            house_type = div('div.house-datelist span:eq(0)').text()

            ziying = '0'
            ziying_flag = div('div.house-name i.icon-proprietary')
            if ziying_flag:
                ziying = '1'

            woshishu = tingshu = weishu = renshu = taoshu = '0'
            spans = div('div.house-datelist span')
            for span in spans:
                span_text = pq(span).text()
                if u'室' in span_text:
                    woshishu = span_text.split(u'室')[0][-1]
                if u'厅' in span_text:
                    tingshu = span_text.split(u'厅')[0][-1]
                if u'卫' in span_text:
                    weishu = span_text.split(u'卫')[0][-1]
                if u'宜住' in span_text:
                    renshu = span_text.strip(u'宜住').strip(u'人')
                if u'套' in span_text:
                    taoshu = span_text.strip(u'套')

            price = div('div.house-sid div.price-cont span.price-value').text()
            original_price = div('div.house-sid div.price-cont .m-return-money.j-ReturnMoneyTips b.number-box:eq(0)').text()

            score = div('div.house-judgement span.hotel-value').text()
            comment_num = div('div.house-judgement span.comments-count').text()

            meta['house_name'] = house_name
            meta['house_info'] = [meta['city_name'], house_name, house_type, ziying, woshishu, tingshu, weishu, renshu, taoshu, price, original_price, score, comment_num]

            house_detail_url = self.domain + house_url
            #return Request(house_detail_url, callback=self.parse_detail, meta=meta)
            yield Request(house_detail_url, callback=self.parse_detail, meta=meta)

        pages = html_pq('div.pages').text()
        if u'下一页' in pages:
            meta['page_num'] += 1
            yield Request(self.url % (meta['city_pinyin'], meta['page_num']), meta=meta, callback=self.parse_list)

    def parse_detail(self, response):
        meta = response.meta
        html = response.body_as_unicode()
        html_pq = pq(html)

        print '\t[GET HOUSE INFO] house_name: %s' % meta['house_name']

        #平米数，床数，床型
        pingmishu = chuangshu = '0'
        chuangxing = ''
        #设施配套
        #电视机 电冰箱 洗衣机 空调 暖气 毛巾 牙具 拖鞋 洗发/沐浴露 吹风机 淋浴 浴缸 饮水机 热水壶 WIFI 宽带 有线电视 全天热水 电梯 门禁 保安 游泳池 便利店 停车位 温泉 健身设施 会所 儿童乐园
        facility_names = [u'电视机',u'电冰箱',u'洗衣机',u'空调',u'暖气',u'毛巾', \
            u'牙具',u'拖鞋',u'洗发/沐浴露',u'吹风机',u'淋浴',u'浴缸',u'饮水机', \
            u'热水壶',u'WIFI',u'宽带',u'有线电视',u'全天热水',u'电梯',u'门禁', \
            u'保安',u'游泳池',u'便利店',u'停车位',u'温泉',u'健身设施',u'会所',u'儿童乐园']
        facilities = ['0' for _ in facility_names]
        #提供: 吸烟 加床 宠物 做饭 聚会 外宾 发票
        offer_names = [u'吸烟',u'加床',u'宠物',u'做饭',u'聚会',u'外宾',u'发票']
        offers = ['0' for _ in offer_names]
        #服务:叫醒服务 行李寄存 票务服务 租车服务 商务服务 加床 订票
        service_names = [u'叫醒服务',u'行李寄存',u'票务服务',u'租车服务',u'商务服务',u'加床',u'订票']
        services = ['0' for _ in service_names]
        #小区信息: 建成年份 绿化率 开发商 物业 停车费
        info_names = [u'建成年份',u'绿化率',u'开发商',u'物业',u'停车费']
        infos = ['' for _ in info_names]

        unit_intro_divs = html_pq('#unitIntro div.info-cont')
        for div in unit_intro_divs:
            div_text = pq(div)('h2').text()
            if u'户型' in div_text:
                type_spans = pq(div)('span.item-box')
                for span in type_spans:
                    span_text = pq(span).text()
                    if u'平米' in span_text:
                        pingmishu = span_text.strip(u'平米')
                    if u'张床' in span_text:
                        tmp = span_text.split(u'张床，')
                        if len(tmp) > 1:
                            chuangshu = tmp[0]
                            chuangxing = tmp[1].replace(',', ';')
            elif u'设施' in div_text:
                facility_spans = pq(div)('div.item-group:eq(0) span.item-box')
                facility_text = facility_spans.text()
                for i in range(len(facility_names)):
                    if facility_names[i] in facility_text:
                        facilities[i] = '1'

                offer_spans = pq(div)('div.item-group:eq(1) span.item-box.has')
                offer_text = pq(offer_spans).text()
                for i in range(len(offer_names)):
                    if offer_names[i] in offer_text:
                        offers[i] = '1'
            elif u'管理' in div_text:
                service_spans = pq(div)('div.item-group:eq(1) span.item-box')
                service_text = service_spans.text()
                for i in range(len(service_names)):
                    if service_names[i] in service_text:
                        services[i] = '1'

        residential_divs = html_pq('#residential div.info-cont')
        for div in residential_divs:
            div_text = pq(div)('h2').text()
            if u'信息' in div_text:
                info_spans = pq(div)('span')
                for info_span in info_spans:
                    info_text = pq(info_span).text()
                    for i in range(len(info_names)):
                        if info_names[i] in info_text:
                            infos[i] = info_text.split('-')[-1]

        house_info = [response.url, pingmishu, chuangshu, chuangxing, ','.join(offers), \
                ','.join(facilities), ','.join(services), ','.join(infos)]

        meta['house_info'] += house_info

        url = 'http://www.tujia.com/UnitDetail/UnitProduct/'
        house_id = response.url.strip('.htm').split('_')[-1]
        today = date.today()
        start_date = str(date.today() + timedelta(days=1))
        end_date = str(date.today() + timedelta(days=2))
        formdata = {
            'unitId': house_id,
            'productId': '0',
            'unitDetailSubType': '0',
            'startTime': start_date,
            'endTime': end_date,
            'bookingCount': '1'
        }
        yield FormRequest(url, formdata=formdata, meta=meta, callback=self.parse_price, method='POST')

    def parse_price(self, response):
        meta = response.meta
        html = response.body_as_unicode()

        print '\t\t[GET PRICE] house_name: %s' % meta['house_name']
        #预付价 标准价 途家专享价 连住7天优惠 连住30天优惠
        prices = ['' for i in range(10)]

        html_pq = pq(html)
        trs = html_pq('table.table-products-cont tr')
        for tr in trs:
            td1 = pq(tr)('td.item-first')
            product_name = td1('.product-name').text()
            td4 = pq(tr)('td.item-04')
            book = td4('span').text()
            td5 = pq(tr)('td.item-05')
            price = td5('span.price-cont').text().strip(u'¥').strip()
            if u'预付价 ' in product_name:
                prices[0] = book
                prices[1] = price
            elif u'标准价' in product_name:
                prices[2] = book
                prices[3] = price
            elif u'途家专享价 ' in product_name:
                prices[4] = book
                prices[5] = price
            elif u'连住7天优惠' in product_name:
                prices[6] = book
                prices[7] = price
            elif u'连住30天优惠' in product_name:
                prices[8] = book
                prices[9] = price

        meta['house_info'] += prices
        info = ','.join(meta['house_info'])
        file_name = os.path.join(os.path.abspath(__file__).replace('python/ershoufang/tujia/tujia/spiders/tujia_spider.py', 'result/tujia.txt'))
        fw = open(file_name, 'a')
        fw.write(info.encode('utf8') + '\n')
        fw.close()


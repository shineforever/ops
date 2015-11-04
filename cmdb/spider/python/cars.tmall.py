# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
import time
import chardet
from pyquery import PyQuery as pq
import os
import cookielib

import sys

reload(sys)
sys.setdefaultencoding("utf-8")

# class MyHTTPRedirectHandler(urllib2.HTTPRedirectHandler):
#     def http_error_302(self, req, fp, code, msg, headers):
#         print headers
#         return urllib2.HTTPRedirectHandler.http_error_302(self, req, fp, code, msg, headers)
#
#     http_error_301 = http_error_303 = http_error_307 = http_error_302


spider_url = 'http://list.tmall.com/search_product.htm?spm=a2165.7102365.1997901373.55.aYtwyt&sort=s&style=g&from=sn_1_cat-qp&cat=50106135#J_crumbs'
pay_types = {'total_pay': u'全款', 'bargin_pay': u'定金', 'down_pay': u'订金', 'other': u'其他'}
request_header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36', 'X-Mashape-Key': 'U3sk6nAZzBmshyiHEUZHigodYxLGp1ZTnkd8LWULJmRRp'}


def process_url(url):
    """
        递归访问url
    :param url:
    :return:
    """

    request = urllib2.Request(url, headers=request_header)
    # 其中加入了cookie的处理， 但是有可能无效
    request.add_header('Cookie', 'cna=+hmpDKT5KUACAW/NOs0o74Gm; lzstat_uv=3477290130136283083|3535917; _tb_token_=dFaTOQHs3aSb; cookie2=629a728c35c38afbf156d308d7a8e472; t=527ad043fd968bb772c9d8929dda8053; pnm_cku822=021UW5TcyMNYQwiAiwQRHhBfEF8QXtHcklnMWc%3D%7CUm5Ockt0SnFIcEV6Qn9LcSc%3D%7CU2xMHDJ7G2AHYg8hAS8RKwUlC1c2UDxbJV9xJ3E%3D%7CVGhXd1llXGNdZl9nUm1VaFxmUWxOekRxRX9EfkR%2FRXBLd057Q207%7CVWldfS0SMg0xCioWIwMtEGFfMgcuEyoQKAI4ACUAcg1kShxK%7CVmhIGCUFOBgkGiMXNw82CzAQLBIpEjIIMwYmGiQfJAQ%2BATRiNA%3D%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A1349*5406-client%3A1349*642-offset%3A1349*5406-screen%3A1366*768; cq=ccp%3D1; CNZZDATA1000279581=534600281-1423644582-%7C1423644582; isg=764987DCDFF096017554CC275974912C')
    cookie_processor = cookielib.CookieJar()
    opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookie_processor))
    urllib2.install_opener(opener)
    cars_page = urllib2.urlopen(request)
    print "cars page status code: ", cars_page.getcode()
    cars_html = cars_page.read()
    if isinstance(cars_html, str):
        cars_html = unicode(cars_html, chardet.detect(cars_html)['encoding'])
    # 处理list页
    process_data(cars_html)
    # 是否递归
    next_page = pq(cars_html)('.ui-page-next').attr['href']
    if next_page:
        next_url = spider_url[0: spider_url.index('?')].strip()+str(next_page)
        print 'next_url : ', next_url
        time.sleep(2)
        process_url(next_url)
    else:
        return


def process_data(html_content):
    """
        处理list页
    :param html_content:
    :return:
    """
    detail_url_p = r'http://detail.tmall.com/item.htm?id='
    html_pq = pq(html_content)('#J_ItemList .product')
    for i in range(len(html_pq)):
        car_price = html_pq.eq(i)('.productPrice').text()
        list_quantity = html_pq.eq(i)('.productStatus span em').text()
        deal_id = html_pq.eq(i).attr['data-id']
        detail_url = detail_url_p + str(deal_id).strip()
        detail_request = urllib2.Request(detail_url, headers=request_header)
        # cookie有可能无效， 需要收到处理
        detail_request.add_header('Cookie', 'cna=+hmpDKT5KUACAW/NOs0o74Gm; lzstat_uv=3477290130136283083|3535917; pnm_cku822=236UW5TcyMNYQwiAiwQRHhBfEF8QXtHcklnMWc%3D%7CUm5Ockt0SnFJc0d5RnhMeC4%3D%7CU2xMHDJ7G2AHYg8hAS8RKwUlC1c2UDxbJV9xJ3E%3D%7CVGhXd1llXGNdZl5kUG5Rb1tvWGVHeER6QH9LcU10SXBOd0l8RXtVAw%3D%3D%7CVWldfS0RMQo0DCwQLQ0jQSJGI0UiWyNYIgxaDA%3D%3D%7CVmhIGCUFOBgkGiMXNwkzDTgYJBohGjoAOw4uEiwXLAw2CTxqPA%3D%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; isg=0F164EDDE87A46C8CC0A87C50C5EF3A3; t=527ad043fd968bb772c9d8929dda8053; _tb_token_=2kUVvwlsFE89; cookie2=92206a258605aeddf785f45570af25a7')
        detail_page = urllib2.urlopen(detail_url).read()
        if isinstance(detail_page, str):
            detail_page = unicode(detail_page, chardet.detect(detail_page)['encoding'])
        # ----------------------详情页处理------------------------
        entity = process_detail_info(detail_page)
        raw = '%s\t%s\t%s\t%s\n' % (entity, list_quantity, car_price, time_str)
        print raw
        fw.write(raw)


def process_detail_info(detail_page):
    """
        处理详情页
    :param url:
    :return:
    """
    title = pq(detail_page)('.tb-detail-hd h1').text()
    if isinstance(title, str) and chardet.detect(title)['encoding']:
        title = unicode(title, chardet.detect(title)['encoding'])
    pay_type = u''
    if pay_types['total_pay'] in title:
        pay_type = pay_types['total_pay']
    elif pay_types['bargin_pay'] in title:
        pay_type = pay_types['bargin_pay']
    elif pay_types['down_pay'] in title:
        pay_type = pay_types['down_pay']
    else:
        pay_type = pay_types['other']
    # car_price = pq(detail_page)('.tm-price-panel .tm-price').text()  # 价格是再次加载进去的
    car_brand = pq(detail_page)('#J_attrBrandName').text()
    car_brand = str(car_brand).replace(u'品牌:', u'')
    car_type = pq(detail_page)('#J_AttrUL li').eq(1).text()
    if str(car_type).__contains__(u'车型:'):
        car_type = str(car_type).replace(u'车型:', u'')
    if str(car_type).__contains__(u'车系，'):
        car_type = str(car_type).replace(u'车系，', u'')
    # detail_quantity = pq(detail_page)('.tm-ind-panel .tm-ind-sellCount').text() # 详情页的月销量， 暂时无法得到
    # if not detail_quantity:
    #     detail_quantity = -1
    entity = '%s\t%s\t%s' % (pay_type, car_brand, car_type)
    # print entity
    return entity


def main():
    """
    MAIN
    :return:
    """
    if not os.path.isdir('../result/tmall'):
        os.mkdir('../result/tmall')
    result_path = '../result/tmall/tmall_cars_'+time_str.strip()+'.txt'
    global fw
    fw = open(result_path, 'w+')
    title = '%s\t%s\t%s\t%s\t%s\t%s\n' % ('购买类型', '品牌', '车系\车型', '月销售数量', '价格', '抓取时间')
    print title
    fw.write(title)
    process_url(spider_url)
    fw.close()

if __name__ == '__main__':
    time_str = time.strftime('%Y-%m-%d', time.localtime(time.time()))
    main()

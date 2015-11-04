# -*- coding: UTF-8 -*-
'''
Purpose:
    1. crawl Juhuasuan of taobao
    2. Gather SKU of 方太/西门子...
Author: Patrick Zhang(Patrick.zhang@bda.com)
History:
    2015.07.30 Patrick Zhang write comments in this format
'''
from pyquery import PyQuery as pq
import urllib2
import json
import re
from datetime import date, time
import ssl

# 避免python urlopen error EOF occurred in violation of protocol错误
# 貌似没用，依旧会有这个问题
ssl.PROTOCAL_SSLv23 = ssl.PROTOCOL_TLSv1

# 需要抓取的品牌
BRAND_SET = set([u"老板", u"方太", u"华帝", u"西门子", u"美的"])
# 聚划算品牌团URL
HOME_URL = "https://ju.taobao.com/tg/brand.htm"
# 商品详情页“已售”异步请求URL
SOLD_URL = "https://dskip.ju.taobao.com/detail/json/item_dynamic.htm?item_id="
# request retry times
MAX_RETRY = 10
current_retry = 0

# re-request URL in case of connection failure or violation of protocol
def __open_url__(url):
    global current_retry
    try:
        if current_retry > MAX_RETRY:
            print "request failed [exceed max retry times]"
            return
        if current_retry:
            print 'current_retry: ', current_retry
        response = urllib2.urlopen(url).read()
        return response
    except Exception as e:
        print e
        current_retry += 1
        response = urllib2.urlopen(url).read()
        return response

# 1. 访问页面，获取home中的"数码家电"的ajax url
def get_home_url():
    home_pq = pq(__open_url__(HOME_URL))
    lis = home_pq("#J_FixedNav ul li")
    # 获取自定义楼层所属id 
    floor_id = None
    for x in xrange(0, len(lis)):
        if lis.eq(x).text() == u"数码家电":
            floor_id = lis.eq(x)("a").attr("href")[1:]
    return home_pq("#" + floor_id).attr("data-ajax") if floor_id else None

# 2. 根据ajax的url获取品牌列表
def get_brand_dict(ajax_url):
    json_obj = json.loads(__open_url__("https:" + ajax_url))

    # dict: brand_name: [link1, link2]
    # 有可能一个品牌对应多个活动链接
    brand_dict = {key : set() for key in BRAND_SET}
    for brand in json_obj["brandList"]:
        brand_name = brand["baseInfo"]["brandName"]
        if "/" in brand_name:
            brand_name = brand_name.split("/")[1]
        # if brand_name in BRAND_SET:
        if brand_dict.has_key(brand_name):
            brand_dict[brand_name].add("https:" + brand["baseInfo"]["activityUrl"])
    return brand_dict

# 4. 分析HTML，提取具体商品信息
def get_item_info(brand, activity_url):
    # html = urllib2.urlopen(activity_url).read()
    # html = __open_url__(activity_url)
    html_pq = pq(__open_url__(activity_url))

    item_set = set()
    # category dict: item_url > category
    category_dict = {}
    # 商品楼层除了第一层，其他是异步加载的，所以需要一层一层的找
    # 第一层
    floor_1st_title = html_pq("#content #floor1 .l-f-tbox").text()
    # print floor_1st_title
    floor_1st = html_pq("#content .ju-itemlist li")
    for x in xrange(0, len(floor_1st)):
        item_url = floor_1st.eq(x)("a").attr("href")
        if item_url:
            item_set.add("https:" + item_url)
            category_dict["https:" + item_url] = floor_1st_title
    # 从第二层开始，先找每一层url，再找每一层items
    floors = html_pq("#content .J_ItemList")
    for x in xrange(0, len(floors)):
        floor_url = floors.eq(x).attr("data-url")
        # 返回的json串是非规则的，不能直接解析
        # json_str = urllib2.urlopen("https:" + floor_url).read()
        json_str = __open_url__("https:" + floor_url)
        prog = re.compile("a href=\"([^,]*?)\"")
        match = prog.findall(json_str)
        # map(lambda x: item_set.add("https:" + x), match)
        # map(lambda x: category_dict[("https:" + x)] = floor_title, match)
        floor_title = html_pq("#content #floor" + str(x+2) + " .l-f-tbox").text()
        # print floor_title
        for suffix in match:
            item_url = "https:" + suffix
            item_set.add(item_url)
            category_dict[item_url] = floor_title
    # print category_dict

    #######################ITEM ID收集完毕##########################
    with open('/root/sp/result/auto/juhuasuan.txt', 'a') as a_file:
        for item_url in item_set:
            item_html = __open_url__(item_url)
            item_pq = pq(item_html)
            properties = item_pq("div.ju-wrapper .J_mainBox")
            # title
            title = properties("h2").text() 
            # Tag
            tag = properties(".biztag  label").text()
            # 价格
            current_price = properties(".currentPrice").text()
            # 原价
            original_price = properties(".originPrice").text()
            # 店铺名称
            shop_name = item_pq("#detail-left div a.sellername").text()
            # 店铺URL
            shop_url = "https:" + item_pq("#detail-left div a.sellername").attr("href")
            # print shop_name, shop_url
            # 已售 - 异步加载的
            # sold_str = urllib2.urlopen(SOLD_URL + item_url.split("item_id=")[1]).read()
            sold_str = __open_url__(SOLD_URL + item_url.split("item_id=")[1])
            prog = re.compile("\"stock\":\W\"(\d+)\",")
            # 库存数量
            stock = prog.findall(sold_str)[0]
            # 已售数量
            prog = re.compile("\"soldCount\":\W\"(\d+)\",")
            sold_count = prog.findall(sold_str)[0]
            # 日期
            today = date.today()
            row = u"{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\n".format(brand, title, \
                item_url, category_dict[item_url], tag, current_price, original_price, \
                stock, sold_count, shop_name, shop_url, today).encode('utf8')
            print row
            a_file.write(row)
             
# 3. 根据品牌活动URL，获取上架商品信息
def get_products():
    ajax_url = get_home_url()
    if ajax_url:
        brand_dict = get_brand_dict(ajax_url)

        for brand in brand_dict.keys():
            for activity_url in brand_dict[brand]:
                get_item_info(brand, activity_url)
    else:
        print u"今日没有‘数码家电’上架信息"


def main():
    get_products()

if __name__ == "__main__":
    main()
#coding:utf8

import urllib2
import urllib
import random
import json
import re
import cookielib
import collections
from cookielib import CookieJar
from pyquery import PyQuery as pq
import time
import sys
import traceback
reload(sys)
sys.setdefaultencoding('utf-8')

# cookiejar to help deal with cookie
cj_mut = CookieJar()
opener_mut = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj_mut))

# output file path
website_traffic_file_path = '../../result/mut_website_traffic.txt'
domain_traffic_file_path = '../../result/mut_domain_traffic.txt'

# to keep track of running state
mut_website_context = '../../result/mut_website_context.txt'
web_cur_month = '2014-12'
web_cur_page = 1
web_cur_num = 0
web_month_flag = 0
web_page_flag = 0
web_num_flag = 0

# months to deal with
months = [
    '2014-12',
    '2014-11',
    '2014-10',
    '2014-09',
    '2014-08',
    '2014-07',
    '2014-06',
    '2014-05',
    '2014-04',
    '2014-03',
    '2014-02',
    '2014-01'
]

headers = [
    ('Accept','*/*'),
    ('User-Agent','Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)'),
    ('Accept-Language','zh-cn'),    
    ('x-microsoftajax','Delta=true'),
    ('Content-Type','application/x-www-form-urlencoded; charset=utf-8'),
    ('Cache-Control','no-cache'),
    ('Connection','Keep-Alive'),
    ('Pragma','no-cache'),
    ('Referer','http://mut.itracker.cn:8081/WebRanking.aspx?navi=true&ranking_type=0')
]

# common utils
max_retry = 3
current_retry = 0

def open_url(url, data = None):
    global current_retry
    try:
        if current_retry >= max_retry:
            print 'request failed [exceed max retry times]'
            return
        # print 'opening url: ', url
        if current_retry != 0:
            print 'current_retry: ', current_retry
        response = ''
        if data is not None:
            if type(data) is str:
                response = opener_mut.open(url, data)
            else:
                response = opener_mut.open(url, urllib.urlencode(data))
        else:
            response = opener_mut.open(url)
        current_retry = 0
        return response
    except Exception as inst:
        print inst
        current_retry = current_retry + 1
        if data is not None:
            open_url(url, data)
        else:
            open_url(url)

# login and initialization process
def init():
    print 'initialization starts.'
    global month_period
    global categories
    init_url = r'http://iutmain.itracker.cn/Class_DetailCate.aspx?IMI=1&DateType=W&QueryDate=2015-10&doCache=0'
    response = opener_iut.open(init_url)
    print "status code: ", response.getcode()
    response_content = response.read()
    for time in p_month.findall(response_content):
        if time.startswith(('2014','2015')):
            print 'adding %s to month_period' % time
            month_period.append(time)
    for category in p_category.findall(response_content):
        print 'adding %s to categories' % category
        categories.append(category)

def login():
    print 'starting login process'
    global cj_mut
    global opener_mut
    cj_mut.clear()
    strinfo = '6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrIDArlUGok15jq374SCLJRHKjjFgbYWOf%2Bid72YNdLPFvDLJQzyyGrdKEXIDl3F95x6pll8fDOBxvl4sSjFx5CcC0QlTqVS7AWOtENNh5cC%2B'
    rand = str('%.16f' % random.random())
    url_index = r'http://ird.itracker.cn/Ajax/index.ashx?_=1423466207333&info=%s&page=index&m=%s' % (strinfo, rand)
    req_index = urllib2.Request(url_index)
    resp_index = urllib2.urlopen(req_index)
    print 'resp_index status code: ', resp_index.getcode()
    json_resp_index = json.loads(resp_index.read())
    guid = json_resp_index['LoginStatus'][0]['state']
    url_mut = r'http://mut.itracker.cn:8081/Home.aspx?guid=%s' % guid
    resp_mut = opener_mut.open(url_mut)
    print 'resp_mut status code: ', resp_mut.getcode()
    c = cookielib.Cookie(None, 'hasshown', '1', '8081', True, 'mut.itracker.cn', True, False, '/', True, False, None, False, 'TestCookie', None, None, False)
    cj_mut.set_cookie(c)
    opener_mut.addheaders = headers
    for cookie in cj_mut:
        print cookie

# app_traffic
final_page_pattern = re.compile(r'\',\'(\d*)\'\)')

formdata = {
    'ctl00$ScriptManager1':'ctl00$UpdatePanel1|ctl00$cphPage$QueryCondition1$btnOK',
    'ddl_chart1':'WeekMonthlyUniqueUsers',
    'ddl_chart2':'WeekMonthlyUniqueUsersByDay',
    'ddl_chart3':'WeekMonthlyUsageDaysPerUser',
    '__ASYNCPOST':'true',
    '__EVENTTARGET':'',
    '__EVENTARGUMENT':''
}

def encodeJsonParam(param):
    a = '{'
    for item in param.items():
        a = a + '\"' + item[0] + '\"' + ':'
        if item[1] == "null" or item[1] == "{}" or item[1] == "false":
            a = a + item[1] + ','
        else:
            a = a + '\"' + item[1] + '\"' + ','
    a = a[:-1]
    a = a + '}'
    return 'JsonParam=' + urllib.quote(a)

# website traffic
webJsonParam = collections.OrderedDict()
webJsonParam["Purpose"]="0"
webJsonParam["ChangeFieldCount"]="0"
webJsonParam["MaxChangeCount"]="100"
webJsonParam["DataRangeType"]="1"
webJsonParam["DateRangeWeekMonth"]="2014-12"
webJsonParam["AppName"]=""
webJsonParam["AppCategory"]=""
webJsonParam["AppClass"]=""
webJsonParam["sourceLossType"]="0"
webJsonParam["targetType"]="0"
webJsonParam["DetailOrMyWatch"]="null"
webJsonParam["RankingType"]="0"
webJsonParam["OrderByColumn"]="WeekMonthlyUniqueUsers"
webJsonParam["UserID"]="null"
webJsonParam["DateRangeStart"]=""
webJsonParam["DateRangeEnd"]=""
webJsonParam["TotalRowCount"]="379"
webJsonParam["DateTrendCount"]="0"
webJsonParam["TrendTarget"]="null"
webJsonParam["TimeSegmentType"]="0"
webJsonParam["Device"]=""
webJsonParam["Gender"]=""
webJsonParam["Age"]=""
webJsonParam["Education"]=""
webJsonParam["PersonalIincome"]=""
webJsonParam["Province"]=""
webJsonParam["NetworkOperator"]=""
webJsonParam["DeviceType"]=""
webJsonParam["ScreenSize"]=""
webJsonParam["Price"]=""
webJsonParam["TotalUsers"]="0"
webJsonParam["TotalStartups"]="0"
webJsonParam["TotalEffectiveTime"]="0"
webJsonParam["IS_ENGLISH"]="false"
webJsonParam["PageStartIndex"]="1"
webJsonParam["PageEndIndex"]="20"
webJsonParam["PageSize"]="20"
webJsonParam["EntityName"]="WebRanking"
webJsonParam["ExtFieldCollection"]="{}"
webJsonParam["FieldInfoCollection"]="{}"
webJsonParam["device"]=""

def web_traffic_encode(formdata):
    data = urllib.urlencode(formdata)
    data = data + '&power=False&power=True'
    return data

def init_website_traffic():
    global web_cur_month
    global web_cur_page
    global web_cur_num
    try:
        fr = open(mut_website_context, 'r')
        entity = fr.readline()
        if entity:
            entity = entity.split(',')
            web_cur_month = entity[0]
            web_cur_page = int(entity[1])
            web_cur_num = int(entity[2])
        print web_cur_month + ' current page: ' + str(web_cur_page) + ' current num: ' + str(web_cur_num)
    except:
        print 'load file mut_app_context failed'

def get_website_traffic():
    global web_month_flag
    init_website_traffic()
    url = r'http://mut.itracker.cn:8081/WebRanking.aspx?navi=true&ranking_type=0'
    response = open_url(url)
    if response is None or response.getcode() != 200:
        print 'request failed: ', url
        return
    html = response.read()
    for i in range(len(months)):
        if months[i] == web_cur_month:
            web_month_flag = 1
            print 'month flag turn true: ', months[i]
        if web_month_flag == 0:
            continue
        try:
            result = get_web_traffic_by_month(months[i], html)
            if result == False:
                return
        except Exception as inst:
            print inst
            traceback.print_exc()
            fw = open(mut_website_context, 'w')
            fw.write(months[i] + ',1,0')
        

def get_web_traffic_by_month(month, html):
    global web_page_flag
    if web_cur_page == 1:
        web_page_flag = 1
    init_formdata(month, html)
    print 'start setting params for ', month
    set_web_traffic_params(webJsonParam, month, 1)
    print 'finish setting params for ', month
    url = r'http://mut.itracker.cn:8081/WebRanking.aspx?navi=true&ranking_type=0'
    response = open_url(url, web_traffic_encode(formdata))
    read = response.read()
    init_formdata(month, read, True)
    if web_page_flag == 1:
        first = get_web_traffic_detail(month, read, 1)
        if first == False:
            return False
    total_page = get_domain_traffic_total_page(read)
    print 'total page: ' + total_page
    for page in range(2, int(total_page)+1):
        if page == web_cur_page:
            web_page_flag = 1
            print 'page flag turn true: page = ', str(page)
        if web_page_flag == 0:
            continue
        try:
            print 'working on month: ' + month + ' page: ' + str(page)
            isSuccess = get_web_traffic_by_page(month, page)
            if isSuccess == False:
                print 'isSuccess: False'
                return False
        except:
            fw = open(mut_website_context, 'w')
            fw.write(month + ',' + str(page) + ',0')
            return False

def get_web_traffic_by_page(month, page):
    page_turn_over_formdata(page)
    url = r'http://mut.itracker.cn:8081/WebRanking.aspx?navi=true&ranking_type=0'
    response = open_url(url, web_traffic_encode(formdata))
    try:
        return get_web_traffic_detail(month, response.read(), page)
    except Exception as inst:
        print inst
        traceback.print_exc()
        return False

def get_web_traffic_detail(month, html, page, totalPageFlag = False):
    global web_num_flag
    fw_website = open(website_traffic_file_path, 'a')
    fw_domain = open(domain_traffic_file_path, 'a')
    html = unicode(html, 'utf8')
    data = pq(html)('#ctl00_cphPage_TrendChart1_HidChartData').val()
    dataJson = json.loads(data)
    websiteNames = dataJson[0]['xMarks']
    subdata = pq(html)('#flowersTabcontent_10 .operation1 a')
    websiteEnNames = []
    websiteCats = []
    websiteSubcats = []
    for i in range(len(websiteNames)):
        websiteEnNames.append(subdata.eq(i).attr('app_name').replace(' ',''))
        websiteCats.append(subdata.eq(i).attr('app_category').replace(' ',''))
        websiteSubcats.append(subdata.eq(i).attr('app_class').replace(' ',''))
    trafficData = {}
    for i in range(len(dataJson)):
        temp = re.sub(r'(\w*)(?=:)', '\"\g<1>\"', dataJson[i]['seriesJson']).replace('\'', '\"')
        seriesJson = json.loads(temp)
        traffic = seriesJson[0]['data']
        trafficData[dataJson[i]['title']] = traffic
    for i in range(len(websiteNames)):
        if i == web_cur_num:
            web_num_flag = 1
        if web_num_flag == 0:
            continue
        website_result = ''
        website_result = (website_result + websiteNames[i] + '\t' +
            pq(html)('#webcategory\|' + websiteCats[i]).text().replace(' ','') + '\t' +
            websiteSubcats[i] + '\t' +
            str(trafficData[u'月度覆盖人数'][i]) + '\t' +
            str(trafficData[u'月度覆盖人数比例'][i]) + '\t' +
            str(trafficData[u'月度总访问页面数'][i]) + '\t' +
            str(trafficData[u'月度总访问页面数比例'][i]) + '\t' +
            str(trafficData[u'月度总有效使用时间'][i]) + '\t' +
            str(trafficData[u'月度总有效使用时间比例'][i]) + '\t' +
            str(trafficData[u'日均覆盖人数'][i]) + '\t' +
            str(trafficData[u'日均覆盖人数比例'][i]) + '\t' +
            str(trafficData[u'日均总访问页面数'][i]) + '\t' +
            str(trafficData[u'日均总访问页面数比例'][i]) + '\t' +
            str(trafficData[u'日均总有效使用时间'][i]) + '\t' +
            str(trafficData[u'日均总有效使用时间比例'][i]) + '\t' +
            str(trafficData[u'人均使用天数'][i]) + '\t' +
            str(trafficData[u'人均浏览天数比例'][i]) + '\t' +
            str(trafficData[u'人均访问页面数'][i]) + '\t' +
            str(trafficData[u'人均有效浏览时间'][i]) + '\t' +
            str(trafficData[u'人均单日访问页面数'][i]) + '\t' +
            str(trafficData[u'人均单日有效浏览时间'][i]) + '\t' +
            str(trafficData[u'人均单次有效浏览时间'][i]) + '\t' +
            month + '\n')
        domain_result = get_domain_traffic(websiteEnNames[i], month)
        if domain_result == False:
            fw = open(mut_website_context, 'w')
            fw.write(month + ',' + str(page) + ',' + str(i))
            return False
        fw_website.write(website_result)
        fw_domain.write(domain_result)
    return True

domain_formdata = {
    'ctl00$ScriptManager1':'ctl00$UpdatePanel1|ctl00$cphPage$AspNetPager1',
    'ddl_chart1':'WeekMonthlyUniqueUsers',
    'ddl_chart2':'WeekMonthlyUniqueUsersByDay',
    'ddl_chart3':'WeekMonthlyUsageDaysPerUser',
    '__ASYNCPOST':'true'
}

def get_domain_traffic(websiteEnName, month):
    try:
        print 'getting domain for ', websiteEnName
        global opener_mut
        url = r'http://mut.itracker.cn:8081/WebSubdomain.aspx?web_name=%s&dataRangeType=1&dateRangeWeekMonth=%s&navi=true' % (websiteEnName, month)
        response = open_url(url, None)
        html = response.read()
        inputs = pq(html)('#aspnetForm input')
        for i in range(len(inputs)):
            key = inputs.eq(i).attr('name')
            val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
            if key is not None and key != 'power':
                domain_formdata[key] = val
        domain_formdata['ctl00$cphPage$QueryCondition1$time'] = '1'
        domain_formdata['ctl00$cphPage$QueryCondition1$timeMonth'] = month
        domain_formdata['ctl00$cphPage$QueryCondition1$timeWeek'] = '2014-53'
        domain_formdata['ctl00$Hid_Order_Name'] = 'WeekMonthlyUniqueUsers'
        domain_formdata['__EVENTTARGET'] = 'ctl00$cphPage$AspNetPager1'
        if 'ctl00$cphPage$QueryCondition1$btnOK' in domain_formdata.keys():
                    print 'deleting property from domain_formdata'
                    del domain_formdata['ctl00$cphPage$QueryCondition1$btnOK']
        domain_result = ''
        domain_result = domain_result + get_domain_traffic_detail(month, websiteEnName, html)
        if domain_result == '':
            return domain_result
        total_page = get_domain_traffic_total_page(html)
        print 'total page: ', total_page
        if total_page == '1':
            return domain_result
        for page in range(2, int(total_page)+1):
            print 'working on page ', str(page)
            domain_formdata['__EVENTARGUMENT'] = str(page)
            domain_result = domain_result + get_domain_traffic_detail(month, websiteEnName, open_url(url, domain_formdata).read())
        return domain_result
    except:
        print 'get domain failed for ', websiteEnName
        return False

def get_domain_traffic_detail(month, websiteEnName, html):
    html = unicode(html, 'utf8')
    data = pq(html)('#ctl00_cphPage_TrendChart1_HidChartData').val()
    dataJson = json.loads(data)
    if len(dataJson) == 0:
        return ''
    domainNames = dataJson[0]['xMarks']
    trafficData = {}
    for i in range(len(dataJson)):
        temp = re.sub(r'(\w*)(?=:)', '\"\g<1>\"', dataJson[i]['seriesJson']).replace('\'', '\"')
        seriesJson = json.loads(temp)
        traffic = seriesJson[0]['data']
        trafficData[dataJson[i]['title']] = traffic
    domain_result = ''
    for i in range(len(domainNames)):
        domain_result = (domain_result + domainNames[i] + '\t' + websiteEnName + '\t' +
            str(trafficData[u'月度覆盖人数'][i]) + '\t' +
            str(trafficData[u'月度覆盖人数比例'][i]) + '\t' +
            str(trafficData[u'月度总访问页面数'][i]) + '\t' +
            str(trafficData[u'月度总访问页面数比例'][i]) + '\t' +
            str(trafficData[u'月度总有效使用时间'][i]) + '\t' +
            str(trafficData[u'月度总有效使用时间比例'][i]) + '\t' +
            str(trafficData[u'日均覆盖人数'][i]) + '\t' +
            str(trafficData[u'日均覆盖人数比例'][i]) + '\t' +
            str(trafficData[u'日均总访问页面数'][i]) + '\t' +
            str(trafficData[u'日均总访问页面数比例'][i]) + '\t' +
            str(trafficData[u'日均总有效使用时间'][i]) + '\t' +
            str(trafficData[u'日均总有效使用时间比例'][i]) + '\t' +
            str(trafficData[u'人均使用天数'][i]) + '\t' +
            str(trafficData[u'人均浏览天数比例'][i]) + '\t' +
            str(trafficData[u'人均访问页面数'][i]) + '\t' +
            str(trafficData[u'人均有效浏览时间'][i]) + '\t' +
            str(trafficData[u'人均单日访问页面数'][i]) + '\t' +
            str(trafficData[u'人均单日有效浏览时间'][i]) + '\t' +
            str(trafficData[u'人均单次有效浏览时间'][i]) + '\t' +
            month + '\n')
    return domain_result

def get_domain_traffic_total_page(html):
    html = unicode(html, 'utf8')
    pager = pq(html)('#ctl00_cphPage_AspNetPager1')('a')
    if pager.text() == '':
        return '1'
    for i in range(len(pager)):
        if pager.eq(i).text() == '尾页':
            href = pager.eq(i).attr('href')
            print href
            return final_page_pattern.findall(href)[0]

def set_web_traffic_params(webJsonParam, month, page):
    web_params = json.loads(get_web_param_handler().read())
    totalRowCount = str(web_params['TotalRowCount'])
    pageStartIndex = str(web_params['PageStartIndex'])
    pageEndIndex = str(web_params['PageEndIndex'])
    webJsonParam['TotalRowCount'] = totalRowCount
    webJsonParam['PageStartIndex'] = pageStartIndex
    webJsonParam['PageEndIndex'] = pageEndIndex
    webJsonParam["DateRangeWeekMonth"] = month
    t = random.random()
    url = r'http://mut.itracker.cn:8081/Handler/SetWebParamHandler.ashx?t=%s' % t
    response = open_url(url, encodeJsonParam(webJsonParam))
    result = response.read()
    if result == 'true':
        print 'set app params result: True'
        return True
    else:
        print 'set app params result: False'
        return False

def get_web_param_handler():
    r = str(int(time.time()*1000))
    t = random.random()
    url = r'http://mut.itracker.cn:8081/Handler/GetWebParamHandler.ashx?t=%s&r=%s' % (t, r)
    return open_url(url, None)

def page_turn_over_formdata(page):
    global formdata
    formdata['__EVENTTARGET'] = 'ctl00$cphPage$AspNetPager1'
    formdata['__EVENTARGUMENT'] = ''
    formdata['ctl00$cphPage$AspNetPager1_input'] = str(page)
    formdata['ctl00$ScriptManager1'] = 'ctl00$UpdatePanel1|ctl00$cphPage$AspNetPager1'
    if 'ctl00$cphPage$QueryCondition1$btnOK' in formdata.keys():
        print 'deleting property from formdata'
        del formdata['ctl00$cphPage$QueryCondition1$btnOK']

def init_formdata(month, html, isAjax = False):
    global formdata
    if isAjax:
        viewstate_pattern = re.compile(r'__VIEWSTATE\|(.*?)\|')
        eventvalidation_pattern = re.compile(r'__EVENTVALIDATION\|(.*?)\|')
        formdata['__VIEWSTATE'] = viewstate_pattern.findall(html)[0]
        formdata['__EVENTVALIDATION'] = eventvalidation_pattern.findall(html)[0]
        html = unicode(html, 'utf8')
        inputs = pq(html)('input')
        for i in range(len(inputs)):
            key = inputs.eq(i).attr('name')
            val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
            if key is not None and key != 'power':
                formdata[key] = val.encode('utf8')
    else:
        inputs = pq(html)('#aspnetForm input')
        for i in range(len(inputs)):
            key = inputs.eq(i).attr('name')
            val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
            if key is not None and key != 'power':
                formdata[key] = val
    formdata['ctl00$cphPage$QueryCondition1$time'] = '1'
    formdata['ctl00$cphPage$QueryCondition1$timeMonth'] = month
    formdata['ctl00$cphPage$QueryCondition1$timeWeek'] = '2014-53'
    formdata['ctl00$Hid_Order_Name'] = 'WeekMonthlyUniqueUsers'

def main():
    login()
    get_website_traffic()

if __name__ == "__main__":
    main()
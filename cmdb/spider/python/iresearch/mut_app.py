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
app_traffic_file_path = '../../result/iresearch/mut_app_traffic_201506.txt'

# to keep track of running state
mut_app_context = '../../result/iresearch/mut_app_context.txt'
app_cur_month = '201506'
app_cur_page = 1
app_month_flag = 0
app_page_flag = 0

# pattern of viewstate and eventvalidation
p_viewstate = re.compile(r'__VIEWSTATE\|(.*?)\|')
P_validtation = re.compile(r'__EVENTVALIDATION\|(.*?)\|')

# months to deal with
months = [
    '201506'
    # ,'201505'
    # ,'201504'
    # ,'201503'
    # ,'201502'
    # ,'201501'
]

# data to scrap
index = [
    'ctl00_cphPage_WeekMonthlyUniqueUsers',
    'ctl00_cphPage_WeekMonthlyReach',
    'ctl00_cphPage_WeekMonthlyStartups',
    'ctl00_cphPage_ShareOfWeekMonthlyStartups',
    'ctl00_cphPage_WeekMonthlyEffectiveTime',
    'ctl00_cphPage_ShareOfWeekMonthlyEffectiveTime',
    'ctl00_cphPage_WeekMonthlyUniqueUsersByDay',
    'ctl00_cphPage_WeekMonthlyReachByDay',
    'ctl00_cphPage_WeekMonthlyStartupsByDay',
    'ctl00_cphPage_ShareOfWeekMonthlyStartupsByDay',
    'ctl00_cphPage_WeekMonthlyEffectiveTimeByDay',
    'ctl00_cphPage_ShareOfWeekMonthlyEffectiveTimeByDay',
    'ctl00_cphPage_WeekMonthlyStartupsPerUser',
    'ctl00_cphPage_WeekMonthlyEffectiveTimePerUser',
    'ctl00_cphPage_WeekMonthlyUsageDaysPerUser',
    'ctl00_cphPage_StartupsPerUserPerUsageDay',
    'ctl00_cphPage_EffectiveTimePerUserPerUsageDay',
    'ctl00_cphPage_EffectiveTimePerUserPerStartup'
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
    ('Referer','http://mut.itracker.cn/AppRanking.aspx?navi=true&ranking_type=0')
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
def login():
    print 'starting login process'
    global cj_mut
    global opener_mut
    cj_mut.clear()
    strinfo = '6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrIDArlUGok15jq374SCLJRHKjjFgbYWOf%2Bid72YNdLPFvDLJQzyyGrdKEXIDl3F95x6pll8fDOBxvl4sSjFx5CcC0QlTqVS7AWOtENNh5cC%2B'
    rand = str('%.16f' % random.random())
    url_index = r'http://ird.itracker.cn/Ajax/index.ashx?_=1431077500102&info=%s&page=index&m=%s' % (strinfo, rand)
    req_index = urllib2.Request(url_index)
    resp_index = urllib2.urlopen(req_index)
    print 'resp_index status code: ', resp_index.getcode()
    json_resp_index = json.loads(resp_index.read())
    guid = json_resp_index['LoginStatus'][0]['state']
    url_mut = r'http://mut.itracker.cn/Home.aspx?guid=%s' % guid
    resp_mut = opener_mut.open(url_mut)
    print 'resp_mut status code: ', resp_mut.getcode()
    c = cookielib.Cookie(None, 'hasshown', '1', '80', True, 'mut.itracker.cn', True, False, '/', True, False, None, False, 'TestCookie', None, None, False)
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

JsonParam = collections.OrderedDict()
JsonParam["Purpose"]="0"
JsonParam["ChangeFieldCount"]="0"
JsonParam["MaxChangeCount"]="100"
JsonParam["DataRangeType"]="1"
JsonParam["DateRangeWeekMonth"]="201506"
JsonParam["DetailOrMyWatch"]="null"
JsonParam["AppName"]=""
JsonParam["AppID"]=""
JsonParam["AppCategory"]="null"
JsonParam["AppCategoryID"]=""
JsonParam["AppClass"]="null"
JsonParam["AppClassID"]=""
JsonParam["RankingType"]="0"
JsonParam["OrderByColumn"]="WeekMonthlyUniqueUsers"
# JsonParam["UserID"]="null"
# JsonParam["DateRangeStart"]=""
# JsonParam["DateRangeEnd"]=""
JsonParam["TotalRowCount"]="2731"
JsonParam["DateTrendCount"]="0"
JsonParam["TrendTarget"]="null"
JsonParam["TimeSegmentType"]="0"
JsonParam["Device"]=""
JsonParam["Gender"]=""
JsonParam["Age"]=""
JsonParam["Education"]="null"
JsonParam["PersonalIincome"]="null"
JsonParam["Province"]=""
JsonParam["NetworkOperator"]=""
JsonParam["DeviceType"]=""
JsonParam["ScreenSize"]=""
JsonParam["Price"]=""
JsonParam["TotalUsers"]="0"
JsonParam["TotalStartups"]="0"
JsonParam["TotalEffectiveTime"]="0"
JsonParam["IS_ENGLISH"]="false"
JsonParam["PageStartIndex"]="1"
JsonParam["PageEndIndex"]="20"
JsonParam["PageSize"]="20"
JsonParam["EntityName"]="AppRanking"
JsonParam["ExtFieldCollection"]="{}"
JsonParam["FieldInfoCollection"]="{}"
JsonParam["device"]=""

def init_app_traffic():
    global app_cur_month
    global app_cur_page
    try:
        fr = open(mut_app_context, 'r')
        entity = fr.readline()
        if entity:
            app_cur_month = entity.split(',')[0]
            app_cur_page = int(entity.split(',')[1])
    except:
        print 'load file mut_app_context failed'

def get_app_traffic():
    global app_month_flag
    init_app_traffic()
    url = r'http://mut.itracker.cn/AppRanking.aspx?navi=true&ranking_type=0'
    response = open_url(url)
    if response is None or response.getcode() != 200:
        print 'request failed: ', url
        return
    html = response.read()
    for i in range(len(months)):
        if months[i] == app_cur_month:
            app_month_flag = 1
        if app_month_flag == 0:
            continue
        try:
            get_app_traffic_by_month(months[i], html)
        except Exception, e:
            print e
            traceback.print_stack()
            fw = open(mut_app_context, 'w')
            fw.write(months[i] + ',1')

def get_app_traffic_by_month(month, html):
    global app_page_flag
    if app_cur_page == 1:
        app_page_flag = 1
    print 'start setting params for ', month
    set_app_traffic_params(JsonParam, month, 1)
    print 'finish setting params for ', month
    url = r'http://mut.itracker.cn/AppRanking.aspx?navi=true&ranking_type=0'
    inputs = pq(html)('#aspnetForm input')
    for i in range(len(inputs)):
        key = inputs.eq(i).attr('name')
        val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
        if key is not None:
            formdata[key] = val
    formdata['ctl00$cphPage$QueryCondition1$time'] = '1'
    formdata['ctl00$cphPage$QueryCondition1$timeMonth'] = month
    formdata['ctl00$cphPage$QueryCondition1$timeWeek'] = '201518'
    formdata['ctl00$Hid_Order_Name'] = 'WeekMonthlyUniqueUsers'
    print 'formdata length: ', str(len(formdata))
    response = open_url(url, formdata)
    html_response = response.read()
    total_page = get_app_total_page(html_response)
    if app_page_flag == 1:
        get_app_traffic_detail(month, html_response)
    print 'total page: ', total_page
    set_formdata_for_page(html_response)
    for page in range(2, int(total_page)+1):
        if page == app_cur_page:
            app_page_flag = 1
        if app_page_flag == 0:
            continue
        try:
            get_app_traffic_by_page(month, page, formdata)
        except Exception, e:
            print e
            traceback.print_stack()
            fw = open(mut_app_context, 'w')
            fw.write(month + ',' + str(page))

def get_app_total_page(html):
    html = unicode(html, 'utf8')
    pager = pq(html)('#ctl00_cphPage_AspNetPager1')('a')
    for i in range(len(pager)):
        if pager.eq(i).text() == '尾页':
            href = pager.eq(i).attr('href')
            print href
            return final_page_pattern.findall(href)[0]

def get_app_traffic_by_page(month, page, formdata):
    print 'working on ' + month + ' page ' + str(page)
    formdata['__EVENTARGUMENT'] = str(page)
    if 'ctl00$cphPage$QueryCondition1$btnOK' in formdata.keys():
        print 'deleting property from formdata'
        del formdata['ctl00$cphPage$QueryCondition1$btnOK']
    url = r'http://mut.itracker.cn/AppRanking.aspx?navi=true&ranking_type=0'
    response = open_url(url, formdata)
    get_app_traffic_detail(month, response.read())

def get_app_traffic_detail(month, html):
    fw = open(app_traffic_file_path, 'a')
    html = unicode(html, 'utf8')
    htmlpq = pq(html)
    first = htmlpq('#' + index[0]).val()
    first = re.sub(r'\s', '', urllib.unquote_plus(first.encode('utf8')))
    appNames = json.loads(first)['x']['data']
    indexData = {}
    for i in range(len(index)):
        data = htmlpq('#' + index[i]).val().encode('utf8')
        data = re.sub(r'\s', '', urllib.unquote_plus(data))
        dataJson = json.loads(data)
        indexData[dataJson['y'][0]['name']] = dataJson['y'][0]['data']
    result = ''
    tr_appname = htmlpq('#flowersTabcontent_10 table').eq(0)('tr')
    tr = htmlpq('#flowersTabcontent_10 table').eq(1)('tr')
    for i in range(len(appNames)):
        result = (result + tr_appname.eq(i+2)('td.operation1')('a').attr('app_id') + '\t' + appNames[i] + '\t' +
            tr.eq(i+2)('td').eq(0).text() + '\t' +
            tr.eq(i+2)('td').eq(1).text() + '\t' +
            str(indexData[u'月度覆盖人数'][i]) + '\t' +
            str(indexData[u'月度覆盖人数比例'][i]) + '\t' +
            str(indexData[u'月度总使用次数'][i]) + '\t' +
            str(indexData[u'月度总使用次数比例'][i]) + '\t' +
            str(indexData[u'月度总有效使用时间'][i]) + '\t' +
            str(indexData[u'月度总有效使用时间比例'][i]) + '\t' +
            str(indexData[u'日均覆盖人数'][i]) + '\t' +
            str(indexData[u'日均覆盖人数比例'][i]) + '\t' +
            str(indexData[u'日均总使用次数'][i]) + '\t' +
            str(indexData[u'日均总使用次数比例'][i]) + '\t' +
            str(indexData[u'日均总有效使用时间'][i]) + '\t' +
            str(indexData[u'日均总有效使用时间比例'][i]) + '\t' +
            str(indexData[u'人均使用次数'][i]) + '\t' +
            str(indexData[u'人均有效使用时间'][i]) + '\t' +
            str(indexData[u'人均使用天数'][i]) + '\t' +
            str(indexData[u'人均单日使用次数'][i]) + '\t' +
            str(indexData[u'人均单日有效时间'][i]) + '\t' +
            str(indexData[u'人均单次有效时间'][i]) + '\t' +
            month + '\n')
    fw.write(result)

def set_formdata_for_page(html):
    global formdata
    formdata['ctl00$ScriptManager1'] = 'ctl00$UpdatePanel1|ctl00$cphPage$AspNetPager1'
    viewstate = p_viewstate.findall(html)[0]
    validation = P_validtation.findall(html)[0]
    formdata['__VIEWSTATE'] = viewstate
    formdata['__EVENTVALIDATION'] = validation
    formdata['__EVENTTARGET'] = 'ctl00$cphPage$AspNetPager1'

def set_app_traffic_params(JsonParam, month, page):
    get_param_response = get_app_param_handler()
    params_get = json.loads(get_param_response.read())
    totalRowCount = str(params_get['TotalRowCount'])
    pageStartIndex = str(params_get['PageStartIndex'])
    pageEndIndex = str(params_get['PageEndIndex'])
    JsonParam['TotalRowCount'] = totalRowCount
    JsonParam['PageStartIndex'] = pageStartIndex
    JsonParam['PageEndIndex'] = pageEndIndex
    JsonParam["DateRangeWeekMonth"] = month
    t = random.random()
    url = r'http://mut.itracker.cn/Handler/SetAppParamHandler.ashx?t=%s' % t
    response = open_url(url, encodeJsonParam(JsonParam))
    result = response.read()
    if result == 'true':
        print 'set app params result: True'
        return True
    else:
        print 'set app params result: False'
        return False

def get_app_param_handler():
    r = str(int(time.time()*1000))
    t = random.random()
    url = r'http://mut.itracker.cn/Handler/GetAppParamHandler.ashx?t=%s&r=%s' % (t, r)
    return open_url(url, None)

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

def main():
    login()
    get_app_traffic()

if __name__ == "__main__":
    main()
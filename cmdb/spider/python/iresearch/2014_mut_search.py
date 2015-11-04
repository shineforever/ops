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

# result file
resultFile = '../../result/2014_appSearchResult.txt'

# file that stores appToSearch
appToSearchFile = '../../log/breakpoint/2014_appToSearch.txt'

# app to search list
appToSearch = []

# related url
appDetailUrl = r'http://mut.itracker.cn:8081/AppDetailOfTrend.aspx?appName=%s'

# regexp to find viewstate and validation
p_viewstate = re.compile(r'__VIEWSTATE\|(.*?)\|')
P_validtation = re.compile(r'__EVENTVALIDATION\|(.*?)\|')

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

def dictToString(dict):
    result = ''
    for k,v in dict.iteritems():
        result = result + v + k + '\n'
    return result

headers = [
    ('Accept','*/*'),
    ('User-Agent','Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)'),
    ('Accept-Language','zh-cn'),    
    ('x-microsoftajax','Delta=true'),
    ('Content-Type','application/x-www-form-urlencoded; charset=utf-8'),
    ('Cache-Control','no-cache'),
    ('Connection','Keep-Alive'),
    ('Pragma','no-cache'),
]

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

def init():
    global appToSearch
    try:
        fr = open(appToSearchFile, 'r')
        entity = fr.read()
        entity = unicode(entity, 'utf8')
        if entity:
            apps = entity.split('\n')
            for i in range(len(apps)):
                appToSearch.append((apps[i].split(',')[0].replace(' ', '+'), apps[i].split(',')[1], apps[i].split(',')[2], apps[i].split(',')[3]))
        print str(len(appToSearch))
    except:
        print 'load file appToSearchFile failed'

formdata = {
    'ScriptManager1':'ctl04|ButtonAction',
    'timeMonthInterval':'4',
    'timeMonth':'2014-12',
    'timeWeekInterval':'4',
    'timeWeek':'2014-53',
    'typeSel':'total',
    '__ASYNCPOST':'true'
    # '__EVENTTARGET':''
    # '__EVENTARGUMENT':''
    # '__VIEWSTATE':''
    # '__EVENTVALIDATION':''
    # 'TrendChart1$HidChartData':''
    # 'TrendChart1$trendChartSel':'spline'
    # 'exportHid':''
    # 'TrendChart1$HidTimeSpan':''
    # 'HideTabSel':'0'
    # 'ButtonAction':''
}

appId = ''
appName = ''
appCat = ''
appSubcat = ''

def getAppData(app):
    global appId
    global appName
    global appCat
    global appSubcat
    appId = app[0]
    appName = app[1]
    appCat = app[2]
    appSubcat = app[3]
    global formdata
    response = open_url(appDetailUrl % appId)
    if response is None or response.getcode() != 200:
        print 'request failed: ', appDetailUrl % appId
        return
    html = response.read()
    inputs = pq(html)('#form1 input')
    for i in range(len(inputs)):
        key = inputs.eq(i).attr('name')
        val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
        if key is not None:
            formdata[key] = val
    result = {}
    first = getMonthData(result, '2014-12', '8')
    if first == False:
        return
    second = getMonthData(first, '2014-04', '4')
    if second == False:
        return
    fw = open(resultFile, 'a')
    fw.write(dictToString(result))
    print '[done] appId=%s' % appId

def getMonthData(result, month, interval):
    global formdata
    setFormData(month, interval)
    response = open_url(appDetailUrl % appId, formdata)
    if response is None or response.getcode() != 200:
        print 'request failed: ', appDetailUrl % appId
        return False
    html = response.read()
    html = unicode(html, 'utf8')
    if month == '2014-12':
        inputs = pq(html)('input')
        for i in range(len(inputs)):
            key = inputs.eq(i).attr('name')
            if key == 'TrendChart1$HidChartData' or key == 'TrendChart1$HidTimeSpan':
                val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
                if key is not None:
                    formdata[key] = val
        viewstate = p_viewstate.findall(html)[0]
        validation = P_validtation.findall(html)[0]
        formdata['__VIEWSTATE'] = viewstate
        formdata['__EVENTVALIDATION'] = validation
    htmlpq = pq(html)
    data = htmlpq('#TrendChart1_HidChartData').val()
    if data is None:
        print data
    dataJson = json.loads(data)
    name = []
    indexData = {}
    date = dataJson[0]['xMarks']
    for i in range(12):
        seriesJson = dataJson[i]['seriesJson']
        seriesJson = re.sub(r'(\w*)(?=:)', '\"\g<1>\"', seriesJson).replace('\'', '\"')
        seriesJson = json.loads(seriesJson)[0]
        name.append(seriesJson['name'])
        if len(seriesJson['data']) == 0:
            if interval == '4':
                indexData[seriesJson['name']] = [0,0,0,0]
            else:
                indexData[seriesJson['name']] = [0,0,0,0,0,0,0,0]
        else:
            indexData[seriesJson['name']] = seriesJson['data']
    for i in range(len(date)):
        record = appId + '\t' + appName + '\t' + appCat + '\t' + appSubcat + '\t'
        for j in range(len(name)):
            record = record + str(indexData[name[j]][i]) + '\t'
        result[date[i]] = record
    return result

def setFormData(month, interval):
    global formdata
    if month != '2014-12':
        formdata['__EVENTTARGET'] = 'monthAction'
        formdata['ScriptManager1'] = 'ctl04|monthAction'
        if 'ButtonAction' in formdata.keys():
            # print 'deleting property from formdata'
            del formdata['ButtonAction']
    formdata['HideConditions'] = '{"device":"","Gender":"","Age":"","Education":"","PersonalIincome":"","Province":"","NetworkOperato":"","Price":"","ScreenSize":"","DeviceType":""}'
    formdata['timeMonth'] = month
    formdata['timeMonthInterval'] = interval

def run():
    for i in range(len(appToSearch)):
        getAppData(appToSearch[i])

def main():
    init()
    login()
    run()

if __name__ == "__main__":
    main()
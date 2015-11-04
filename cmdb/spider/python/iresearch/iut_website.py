#coding:utf8

import urllib2
import random
import json
import re
from cookielib import CookieJar
from pyquery import PyQuery as pq
from decimal import Decimal

# cookiejar to help deal with cookie
cj_iut = CookieJar()
opener_iut = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj_iut))

# result file
website_result_file = '../../result/iresearch/iut_website_traffic.txt'

# regular expressions to analyse response
p_month = re.compile(r'dtListM\[\d+]\[3]="(\d{4}-\d{2})"')
p_category_traffic = re.compile(r'iut_data = (\[.*]);')
p_category_title = re.compile(r'iut_title =(\[[\S\s]*?]);')
p_main_category = re.compile(r'selected >(.*?)</option>')
p_page = re.compile(r'</select> /(\d*)(?=</td>)')
p_category = re.compile(r'<option value="(\d*)" \s*>.*</option>')
p_login = re.compile(r'您目前尚未登录或者登录已超时')
p_siteChnName = re.compile(r'\[(.*?)[\.\]]')

# date to scrape
month_period = []

# to keep track of service traffic running state
context_file = '../../result/iresearch/iut_website_context.txt'
domain_task_file = '../../result/iresearch/iut_domain_task.txt'
cur_month = '2015-03'
cur_page = 1

# common utils
def remove_after(string, target):
    pos = find_first(string, target)
    return string[0:pos]

def find_first(string, target):
    l = len(target)
    for i, c in enumerate(string):
        if c == target[0] and string[i:i+l] == target:
            return i

def find_by_regexp(string, regexp):
    pattern = re.compile(regexp)
    match = pattern.findall(string)
    if len(match) == 0:
        return ''
    else:
        return match[0]

def write(content, file_path, flag):
    fw = open(file_path, "a")
    if flag == True:
        fw.write(content.encode('utf8'))
    else:
        fw.write(content)

max_retry = 3
current_retry = 0

def open_url(url):
    global current_retry
    try:
        if current_retry >= max_retry:
            print 'request failed [exceed max retry times]'
            return
        print 'opening url: ', url
        if current_retry != 0:
            print 'current_retry: ', current_retry
        response = opener_iut.open(url)
        current_retry = 0
        return response
    except:
        current_retry = current_retry + 1
        open_url(url)

def need_login(response_content):
    match = p_login.findall(response_content)
    if len(match) == 0:
        return False
    else:
        return True

def build_dict(iut_title, iut_data):
    services = []
    count = len(iut_data)/len(iut_title)
    for index in range(count):
        entity = {}
        for i in range(len(iut_title)):
            entity[iut_title[i]] = iut_data[index*len(iut_title)+i]
        services.append(entity)
    return services

# login and initialization process
def init():
    print 'initialization starts.'
    global month_period
    init_url = r'http://iutmain.itracker.cn/Index_Site.aspx?IMI=1&DateType=W&QueryDate=2015-17&doCache=0'
    response = opener_iut.open(init_url)
    print "status code: ", response.getcode()
    response_content = response.read()
    for time in p_month.findall(response_content):
        if time.startswith(('2015-04','2015-05')):
            print 'adding %s to month_period' % time
            month_period.append(time)
    load_run_context()

def login():
    print 'starting login process'
    global cj_iut
    global opener_iut
    cj_iut.clear()
    strinfo = '6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrIDArlUGok15jq374SCLJRHKjjFgbYWOf%2Bid72YNdLPFvDLJQzyyGrdKEXIDl3F95x6pll8fDOBxvl4sSjFx5CcC0QlTqVS7AWOtENNh5cC%2B'
    rand = str('%.16f' % random.random())
    url_index = r'http://ird.itracker.cn/Ajax/index.ashx?_=1423466207333&info=%s&page=index&m=%s' % (strinfo, rand)
    req_index = urllib2.Request(url_index)
    resp_index = urllib2.urlopen(req_index)
    print 'resp_index status code: ', resp_index.getcode()
    json_resp_index = json.loads(resp_index.read())
    guid = json_resp_index['LoginStatus'][0]['state']
    url_iut = r'http://iutmain.itracker.cn/NLogin.aspx?guid=%s&type=' % guid
    resp_iut = opener_iut.open(url_iut)
    print 'resp_iut status code: ', resp_iut.getcode()
    for cookie in cj_iut:
        print cookie

# get_service_traffic
def save_run_context(month, page):    
    fw = open(context_file, "w")
    context = month + ',' + str(page)
    fw.write(context)

def load_run_context():
    global cur_month
    global cur_page
    fr = open(context_file, "r")
    entity = fr.readline()
    if entity:
        context = entity.split(',')
        cur_month = context[0]
        cur_page = int(context[1])

def build_website_detail(website, siteChnName, siteEnName, month):
    website_detail = ''
    website_detail = (website_detail +
        website['Index'] + '\t' +
        website['Site_ID'] + '\t' + 
        siteChnName + '\t' + 
        siteEnName + '\t' + 
        str(Decimal(website['月度覆盖'].replace(',',''))*10) + '\t' +
        website['月度覆盖比例'] + '\t' +
        str(Decimal(website['月度访问次数'].replace(',',''))*10) + '\t' + 
        website['月度访问次数比例'] + '\t' + 
        str(Decimal(website['月度浏览页面'].replace(',',''))*10) + '\t' + 
        website['月度浏览页面比例'] + '\t' + 
        str(Decimal(website['月度浏览时间'].replace(',',''))*10) + '\t' + 
        website['月度浏览时间比例'] + '\t' + 
        str(Decimal(website['日均覆盖'].replace(',',''))*10) + '\t' + 
        website['日均覆盖比例'] + '\t' + 
        str(Decimal(website['日均访问次数'].replace(',',''))*10) + '\t' + 
        website['日均访问次数比例'] + '\t' + 
        str(Decimal(website['日均浏览页面'].replace(',',''))*10) + '\t' + 
        website['日均浏览页面比例'] + '\t' + 
        str(Decimal(website['日均浏览时间'].replace(',',''))*10) + '\t' + 
        website['日均浏览时间比例'] + '\t' + 
        website['人均月度访问天数'] + '\t' + 
        website['人均月度访问次数'] + '\t' + 
        website['人均月度浏览页面'] + '\t' + 
        website['人均月度浏览时间'] + '\t' + 
        website['人均单日访问次数'] + '\t' + 
        website['人均单日浏览页面'] + '\t' + 
        website['人均单日浏览时间'] + '\t' + 
        website['人均单次平均浏览页面'] + '\t' + 
        website['人均单页平均浏览时间'] + '\t' + 
        month + '\n')
    return website_detail

def build_domain_task(domain_task_list):
    task = ''
    for i in range(len(domain_task_list)):
        task = task + domain_task_list[i][0] + '\t' + domain_task_list[i][1] + '\n'
    return task

def get_detail(month, page):
    url_pattern = u'http://iutmain.itracker.cn/Index_Site.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0&PageIndex=%s'
    url = url_pattern % (month, page)
    response = open_url(url)
    if response is None:
        print 'request failed'
        return 0
    print "status code: ", response.getcode()
    response_content = response.read()
    title_match = p_category_title.findall(response_content)
    domain_url_pattern = r'http://iutmain.itracker.cn/Domain_Index.aspx?Site=%s&DateType=M&QueryDate=%s'
    if title_match:
        iut_title = eval(title_match[0])
        data_match = p_category_traffic.findall(response_content)
        if data_match:
            iut_data = eval(data_match[0])
            websites = build_dict(iut_title, iut_data)
            website_detail = ''
            domain_task_list = []
            for website in websites:
                siteId = website['Site_ID']
                siteEnName = remove_after(website['Site_Domain'], '&nbsp')
                siteChnName = p_siteChnName.findall(website['Site_Domain'])[0]
                website_detail = website_detail + build_website_detail(website, siteChnName, siteEnName, month)
                domain_task_list.append((siteId+'_'+siteChnName+'_'+siteEnName+'_'+month, domain_url_pattern % (siteId, month)))
            write(website_detail, website_result_file, False)
            write(build_domain_task(domain_task_list), domain_task_file, False)
        else:
            print 'no matched iut_data found'
            return 1
    else:
        if need_login(response_content):
            print 'login needed'
            return 0
        else:
            print 'no matched iut_title found'
            return 1

def get_page_count(month):
    # print 'start getting page count for Category: %s, Month: %s' % (category, month)
    url = r'http://iutmain.itracker.cn/Index_Site.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0' % month
    response = open_url(url)
    if response is None:
        print 'request failed'
        return 0
    # print "status code: ", response.getcode()
    response_content = response.read()
    match = p_page.findall(response_content)
    if len(match) == 0:
        if need_login(response_content):
            print 'login needed'
            return 0
    page_count = match[0]
    print 'total page: ', page_count
    return page_count

def get_website_traffic():
    month_flag = 0
    page_flag = 0
    for month in month_period:
        if month == cur_month:
            month_flag = 1
        if month_flag == 0:
            continue
        page_count = int(get_page_count(month))
        print "page count: " + str(page_count)
        if page_count == 0:
            save_run_context(month, 1)
            exit()
        for page in range(1, page_count+1):
            if page == cur_page:
                page_flag = 1
            if page_flag == 0:
                continue
            print "working on Month: %s, Page: %s" % (month, str(page))
            result = get_detail(month, page)
            if result == 0:
                save_run_context(month, page)
                exit()

def main():
    login()
    init()
    get_website_traffic()

if __name__ == "__main__":
    main()
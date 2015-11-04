#coding:utf8

import urllib2
import random
import json
import re
from cookielib import CookieJar
from pyquery import PyQuery as pq

# cookiejar to help deal with cookie
cj_iut = CookieJar()
opener_iut = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj_iut))

# result file
website_result_file = '../../result/iresearch/iut_service_traffic.txt'
domain_result_file = '../../result/iresearch/iut_service_domain_traffic.txt'

# regular expressions to analyse response
p_month = re.compile(r'dtListM\[\d+]\[3]="(\d{4}-\d{2})"')
p_category_traffic = re.compile(r'iut_data = (\[.*]);')
p_category_title = re.compile(r'iut_title =(\[[\S\s]*?]);')
p_main_category = re.compile(r'selected >(.*?)</option>')
p_page = re.compile(r'</select> /(\d*)(?=</td>)')
p_category = re.compile(r'<option value="(\d*)" \s*>.*</option>')
p_login = re.compile(r'您目前尚未登录或者登录已超时')

# category and date to scrape
month_period = []
categories = []

# to keep track of service traffic running state
context_file = '../../result/iresearch/iut_service_context.txt'
domain_task_file = '../../result/iresearch/iut_service_domain_task.txt'
cur_category = '13'
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
    global categories
    init_url = r'http://iutmain.itracker.cn/Class_DetailCate.aspx?IMI=1&DateType=W&QueryDate=2015-16&doCache=0'
    response = opener_iut.open(init_url)
    print "status code: ", response.getcode()
    response_content = response.read()
    for time in p_month.findall(response_content):
        if time.startswith(("2015-03")):
            print 'adding %s to month_period' % time
            month_period.append(time)
    for category in p_category.findall(response_content):
        print 'adding %s to categories' % category
        categories.append(category)
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
def save_run_context(category, month, page):    
    fw = open(context_file, "w")
    context = category + ',' + month + ',' + str(page)
    fw.write(context)

def load_run_context():
    global cur_category
    global cur_month
    global cur_page
    fr = open(context_file, "r")
    entity = fr.readline()
    if entity:
        context = entity.split(',')
        cur_category = context[0]
        cur_month = context[1]
        cur_page = int(context[2])

def build_service_detail(service, index, name, main_category, sub_category, month):
    service_detail = ''
    service_detail = (service_detail + index + '\t' + 
        name + '\t' + 
        main_category + '\t' + 
        sub_category + '\t' + 
        service['月度覆盖'] + '\t' + 
        service['月度覆盖比例'] + '\t' + 
        service['月度访问次数'] + '\t' + 
        service['月度访问次数比例'] + '\t' + 
        service['月度浏览页面'] + '\t' + 
        service['月度浏览页面比例'] + '\t' + 
        service['月度浏览时间'] + '\t' + 
        service['月度浏览时间比例'] + '\t' + 
        service['日均覆盖'] + '\t' + 
        service['日均覆盖比例'] + '\t' + 
        service['日均访问次数'] + '\t' + 
        service['日均访问次数比例'] + '\t' + 
        service['日均浏览页面'] + '\t' + 
        service['日均浏览页面比例'] + '\t' + 
        service['日均浏览时间'] + '\t' + 
        service['日均浏览时间比例'] + '\t' + 
        service['人均月度访问天数'] + '\t' + 
        service['人均月度访问次数'] + '\t' + 
        service['人均月度浏览页面'] + '\t' + 
        service['人均月度浏览时间'] + '\t' + 
        service['人均单日访问次数'] + '\t' + 
        service['人均单日浏览页面'] + '\t' + 
        service['人均单日浏览时间'] + '\t' + 
        service['人均单次平均浏览页面'] + '\t' + 
        service['人均单页平均浏览时间'] + '\t' + 
        month + '\n')
    return service_detail

def build_domain_task(domain_task_list):
    task = ''
    for i in range(len(domain_task_list)):
        task = task + domain_task_list[i][0] + '\t' + domain_task_list[i][1] + '\n'
    return task

def get_page_count(category, month):
    print 'start getting page count for Category: %s, Month: %s' % (category, month)
    url_pattern = r'http://iutmain.itracker.cn/DetailService_Index.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0&Cate=%s&DetailCate=0&PageIndex=1'
    pageone_url = url_pattern % (month, category)
    response = open_url(pageone_url)
    if response is None:
        print 'request failed'
        return 0
    print "status code: ", response.getcode()
    response_content = response.read()
    match = p_page.findall(response_content)
    if len(match) == 0:
        if need_login(response_content):
            print 'login needed'
            return 0
    page_count = match[0]
    print 'total page: ', page_count
    return page_count

def get_detail(category, month, page):
    url_pattern = r'http://iutmain.itracker.cn/DetailService_Index.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0&Cate=%s&DetailCate=0&PageIndex=%s'
    url = url_pattern % (month, category, page)
    response = open_url(url)
    if response is None:
        print 'request failed'
        return 0
    print "status code: ", response.getcode()
    response_content = response.read()
    title_match = p_category_title.findall(response_content)
    if title_match:
        iut_title = eval(title_match[0])
        data_match = p_category_traffic.findall(response_content)
        if data_match:
            iut_data = eval(data_match[0])
            services = build_dict(iut_title, iut_data)            
            main_category = p_main_category.findall(response_content)[0]
            service_detail = ''
            domain_url_pattern = r'http://iutmain.itracker.cn/Domain_Index.aspx?IMI=1&Service=%s&DateType=M&QueryDate=%s&doCache=0'
            domain_task_list = []
            for service in services:
                index = service['Index']
                sub_category = service['Cate_Name']
                service_detail = service_detail + build_service_detail(service, index, remove_after(service['Site_Name'], '&nbsp'), main_category, sub_category, month)
                domain_task_list.append((category+"_"+main_category+"_"+month+"_"+index, domain_url_pattern % (service["Service_ID"], month)))
            write(service_detail, website_result_file, False)
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

def get_service_traffic():
    global domain_task_flag
    flag = 0
    page_flag = 0
    print 'cur_category: %s, cur_month: %s, cur_page: %s' % (cur_category, cur_month, cur_page)
    for category in categories:
        for month in month_period:
            if (category == cur_category) and (month == cur_month):
                flag = 1
            if flag == 0:
                continue            
            page_count = int(get_page_count(category, month))
            print "page count: " + str(page_count)
            if page_count == 0:
                save_run_context(category, month, 1)
                exit()
            for page in range(1, page_count + 1):
                if page == cur_page:
                    page_flag = 1
                if page_flag == 0:
                    continue
                print 'working on Category: %s, Month: %s, Page: %s' % (category, month, str(page))
                result = get_detail(category, month, page)
                if result == 0:
                    save_run_context(category, month, page)
                    exit()
    domain_task_flag = True

domain_task_flag = False
domain_task = []

def load_domain_task():
    global domain_task
    fr = open(domain_task_file, "r")
    while True:
        entity = fr.readline()
        if entity:
            task = entity.split('\t')
            domain_task.append((task[0], task[1]))
        else:
            break

def get_domain_traffic():
    for i in range(len(domain_task)):
        task = domain_task[i]
        domain_response = open_url(task[1])
        if domain_response is not None:
            domain_response_content = domain_response.read()
            try:
            iut_domain_title = eval(p_category_title.findall(domain_response_content)[0])
            iut_domain_data = eval(p_category_traffic.findall(domain_response_content)[0])
            except:
                if need_login(domain_response_content):
                    print 'login needed'
                    return 0
                else:
                    print 'no domain traffic data found'
                    continue
            domains = build_dict(iut_domain_title, iut_domain_data)

def main():
    login()
    init()
    get_service_traffic()
    if domain_task_flag:
        load_domain_task()
        get_domain_traffic()

if __name__ == "__main__":
    main()
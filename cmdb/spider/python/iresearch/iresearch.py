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

# output file path
service_traffic_file_path = '../../result/iresearch_website_traffic.txt'
category_traffic_file_path = '../../result/iresearch_category_traffic.txt'
software_traffic_file_path = '../../result/iresearch_software_traffic.txt'

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
service_traffic_context_file_path = '../../result/iresearch_website_traffic_context.txt'
cur_category = '13'
cur_month = '2015-02'
cur_page = 1

# to keep track of software traffic running state
software_traffic_context_file_path = '../../result/iresearch_software_traffic_context.txt'
cur_software_month = '2015-02'
cur_software_page = 1

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
    fw = open(service_traffic_context_file_path, "w")
    context = category + ';' + month + ';' + str(page)
    fw.write(context)

def load_run_context():
    global cur_category
    global cur_month
    global cur_page
    fr = open(service_traffic_context_file_path, "r")
    entity = fr.readline()
    if entity:
        context = entity.split(';')
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
            for service in services:
                index = service['Index']
                sub_category = service['Cate_Name']
                service_detail = service_detail + build_service_detail(service, index, remove_after(service['Site_Name'], '&nbsp'), main_category, sub_category, month)
                domain_response = open_url(domain_url_pattern % (service["Service_ID"], month))
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
                    for domain in domains:
                        service_detail = service_detail + build_service_detail(domain, index, domain['SubDomain'], main_category, sub_category, month)
            write(service_detail, service_traffic_file_path, False)
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

# get_category_traffic

def build_category_detail(category, sub_category, main_category, month):
    category_detail = ''
    category_detail = (category_detail + 
        category['Index'] + '\t' + 
        sub_category + '\t' + 
        main_category + '\t' + 
        category['月度覆盖'] + '\t' + 
        category['月度覆盖比例'] + '\t' + 
        category['月度访问次数'] + '\t' + 
        category['月度访问次数比例'] + '\t' + 
        category['月度浏览页面'] + '\t' + 
        category['月度浏览页面比例'] + '\t' + 
        category['月度浏览时间'] + '\t' + 
        category['月度浏览时间比例'] + '\t' + 
        category['日均覆盖'] + '\t' + 
        category['日均覆盖比例'] + '\t' + 
        category['日均访问次数'] + '\t' + 
        category['日均访问次数比例'] + '\t' + 
        category['日均浏览页面'] + '\t' + 
        category['日均浏览页面比例'] + '\t' + 
        category['日均浏览时间'] + '\t' + 
        category['日均浏览时间比例'] + '\t' + 
        category['人均月度访问天数'] + '\t' + 
        category['人均月度访问次数'] + '\t' + 
        category['人均月度浏览页面'] + '\t' + 
        category['人均月度浏览时间'] + '\t' + 
        category['人均单日访问次数'] + '\t' + 
        category['人均单日浏览页面'] + '\t' + 
        category['人均单日浏览时间'] + '\t' + 
        category['人均单次平均浏览页面'] + '\t' + 
        category['人均单页平均浏览时间'] + '\t' + 
        month + '\n')
    return category_detail

def get_category_page_count(month):
    print 'start getting category page count for Month: ', month
    url = r'http://iutmain.itracker.cn/Class_DetailCate.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0' % month
    response = open_url(url)
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

def get_category_detail(month, page):
    url = r'http://iutmain.itracker.cn/Class_DetailCate.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0&PageIndex=%s' % (month, page)
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
            categorys = build_dict(iut_title, iut_data)
            category_detail = ''
            for category in categorys:
                sub_category = remove_after(category['DetailCate_Name'], '&nbsp;')
                main_category = find_by_regexp(category['DetailCate_Name'], '&nbsp;\[(.*?)(?=])')
                category_detail = category_detail + build_category_detail(category, sub_category, main_category, month)
            write(category_detail, category_traffic_file_path, False)
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

# get_software_traffic

def save_software_run_context(month, page):    
    fw = open(software_traffic_context_file_path, "w")
    context = month + ';' + str(page)
    fw.write(context)

def load_software_run_context():
    global cur_software_month
    global cur_software_page
    fr = open(software_traffic_context_file_path, "r")
    entity = fr.readline()
    if entity:
        context = entity.split(';')
        cur_software_month = context[1]
        cur_software_page = int(context[2])

def build_software_detail(software, month):
    software_detail = ''
    software_detail = (software_detail + 
        software['Index'] + '\t' + 
        software['Product_Name_CN'] + '\t' + 
        software['ProductType_Name_CN'] + '\t' + 
        software['月度覆盖'] + '\t' + 
        software['月度覆盖比例'] + '\t' + 
        software['月度启动次数'] + '\t' + 
        software['月度启动次数比例'] + '\t' + 
        software['月度使用时间'] + '\t' + 
        software['月度使用时间比例'] + '\t' + 
        software['月度运行时间'] + '\t' + 
        software['月度运行时间比例'] + '\t' + 
        software['日均覆盖'] + '\t' + 
        software['日均覆盖比例'] + '\t' + 
        software['日均启动次数'] + '\t' + 
        software['日均启动次数比例'] + '\t' + 
        software['日均使用时间'] + '\t' + 
        software['日均使用时间比例'] + '\t' + 
        software['日均运行时间'] + '\t' + 
        software['日均运行时间比例'] + '\t' + 
        software['人均月度使用天数'] + '\t' + 
        software['人均月度启动次数'] + '\t' + 
        software['人均月度使用时间'] + '\t' + 
        software['人均月度运行时间'] + '\t' + 
        software['人均单日启动次数'] + '\t' + 
        software['人均单日使用时间'] + '\t' + 
        software['人均单日运行时间'] + '\t' + 
        software['人均单次使用时间'] + '\t' + 
        software['使用占运行时间比例'] + '\t' + 
        month + '\n')
    return software_detail

def get_software_category_page_count(month):
    url = r'http://iutmain.itracker.cn/Class_ProductType.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0' % month
    response = open_url(url)
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

def get_software_detail_page_count(productType, month):
    url = r'http://iutmain.itracker.cn/Index_App.aspx?ProductType=%s&IMI=1&DateType=M&QueryDate=%s&doCache=0' % (productType, month)
    response = open_url(url)
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

def get_software_detail(productType, month, page):
    url = r'http://iutmain.itracker.cn/Index_App.aspx?IMI=1&ProductType=%s&DateType=M&QueryDate=%s&doCache=0&PageIndex=%s' % (productType, month, page)
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
            softwares = build_dict(iut_title, iut_data)
            software_detail = ''
            for software in softwares:
                software_detail = software_detail + build_software_detail(software, month)
            write(software_detail, software_traffic_file_path, False)
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

def get_software_category(month, page):
    url = r'http://iutmain.itracker.cn/Class_ProductType.aspx?IMI=1&DateType=M&QueryDate=%s&doCache=0&PageIndex=%s' % (month, page)
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
            software_categorys = build_dict(iut_title, iut_data)
            for software_category in software_categorys:
                productType = software_category['ProductType_ID']
                page_count = int(get_software_detail_page_count(productType, month))
                if page_count == 0:
                    print 'login needed'
                    exit()
                for page in range(1, page_count + 1):
                    print 'dealing with ProductType: %s, Month: %s, Page: %s' % (productType, month, page)
                    result = get_software_detail(productType, month, page)
                    if result == 0:
                        print 'login needed'
                        exit()
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

def main():   
    login()
    init()
    get_service_traffic()
    # get_category_traffic()
    # get_software_traffic()

def get_service_traffic():
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

def get_category_traffic():
    for month in month_period:
        category_page_count = int(get_category_page_count(month))
        if category_page_count == 0:
            print 'login needed'
            exit()
        for page in range(1, category_page_count + 1):
            result = get_category_detail(month, page)
            if result == 0:
                print 'login needed'
                exit()
    
def get_software_traffic():
    flag = 0
    print 'cur_software_month: %s, cur_software_page: %s' % (cur_software_month, cur_software_page)
    for month in month_period:
        if month == cur_software_month:
            flag = 1
        if flag == 0:
            continue
        page_flag = 0
        software_category_page_count = int(get_software_category_page_count(month))
        if software_category_page_count == 0:
            save_software_run_context(month, 1)
            exit()
        for category_page in range(1, software_category_page_count + 1):
            if category_page == cur_software_page:
                page_flag = 1
            if page_flag == 0:
                continue
            print 'working on Month: %s, Page: %s' % (month, str(category_page))
            result = get_software_category(month, category_page)
            if result == 0:
                save_software_run_context(month, category_page)
                exit()

if __name__ == "__main__":
    main()
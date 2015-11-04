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
domain_result_file = '../../result/iresearch/iut_domain_traffic.txt'

# regular expressions to analyse response
p_month = re.compile(r'dtListM\[\d+]\[3]="(\d{4}-\d{2})"')
p_category_traffic = re.compile(r'iut_data = (\[.*]);')
p_category_title = re.compile(r'iut_title =(\[[\S\s]*?]);')
p_main_category = re.compile(r'selected >(.*?)</option>')
p_page = re.compile(r'</select> /(\d*)(?=</td>)')
p_category = re.compile(r'<option value="(\d*)" \s*>.*</option>')
p_login = re.compile(r'您目前尚未登录或者登录已超时')

# domain task file
task_file = '../../result/iresearch/iut_domain_task.txt'

# to keep track of service traffic running state
context_file = '../../result/iresearch/iut_domain_context.txt'
cur_index = 0

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
        # print 'opening url: ', url
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
domain_task = []

def init():
    print 'initialization starts.'
    fr = open(task_file, "r")
    while True:
        entity = fr.readline()
        if entity:
            entity = re.sub('_+', '_', entity)
            info = entity.split('\t')
            websiteInfo = info[0].split('_')
            domainUrl = info[1].replace('\n','')
            siteId = websiteInfo[0]
            websiteChnName = websiteInfo[1]
            websiteEnName = websiteInfo[2]
            month = websiteInfo[3]
            task = {}
            task['siteId'] = siteId
            task['websiteChnName'] = websiteChnName
            task['websiteEnName'] = websiteEnName
            task['month'] = month
            task['url'] = domainUrl
            domain_task.append(task)
        else:
            break
    load_run_context()
    print 'total tasks: ' + str(len(domain_task))
    print 'current index: ' + str(cur_index)
    print 'initialization complete'

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
def save_run_context(index):    
    fw = open(context_file, "w")
    context = str(index)
    fw.write(context)

def load_run_context():
    global cur_index
    fr = open(context_file, "r")
    entity = fr.readline()
    if entity:
        cur_index = int(entity)

def build_domain_detail(domain, task):
    domain_detail = ''
    domain_detail = (domain_detail +
        domain['Index'] + '\t' +
        domain['Sub_ID'] + '\t' + 
        domain['SubDomain'] + '\t' +
        task['siteId'] + '\t' +
        task['websiteChnName'] + '\t' +
        task['websiteEnName'] + '\t' +
        str(Decimal(domain['月度覆盖'].replace(',',''))*10) + '\t' +
        domain['月度覆盖比例'] + '\t' +
        str(Decimal(domain['月度访问次数'].replace(',',''))*10) + '\t' + 
        domain['月度访问次数比例'] + '\t' + 
        str(Decimal(domain['月度浏览页面'].replace(',',''))*10) + '\t' + 
        domain['月度浏览页面比例'] + '\t' + 
        str(Decimal(domain['月度浏览时间'].replace(',',''))*10) + '\t' + 
        domain['月度浏览时间比例'] + '\t' + 
        str(Decimal(domain['日均覆盖'].replace(',',''))*10) + '\t' + 
        domain['日均覆盖比例'] + '\t' + 
        str(Decimal(domain['日均访问次数'].replace(',',''))*10) + '\t' + 
        domain['日均访问次数比例'] + '\t' + 
        str(Decimal(domain['日均浏览页面'].replace(',',''))*10) + '\t' + 
        domain['日均浏览页面比例'] + '\t' + 
        str(Decimal(domain['日均浏览时间'].replace(',',''))*10) + '\t' + 
        domain['日均浏览时间比例'] + '\t' + 
        domain['人均月度访问天数'] + '\t' + 
        domain['人均月度访问次数'] + '\t' + 
        domain['人均月度浏览页面'] + '\t' + 
        domain['人均月度浏览时间'] + '\t' + 
        domain['人均单日访问次数'] + '\t' + 
        domain['人均单日浏览页面'] + '\t' + 
        domain['人均单日浏览时间'] + '\t' + 
        domain['人均单次平均浏览页面'] + '\t' + 
        domain['人均单页平均浏览时间'] + '\t' + 
        task['month'] + '\n')
    return domain_detail

def get_detail(task, page):
    url = task['url'] + '&PageIndex=' + str(page)
    response = open_url(url)
    if response is None:
        print 'request failed'
        return 0
    response_content = response.read()
    try:
        iut_domain_title = eval(p_category_title.findall(response_content)[0])
        iut_domain_data = eval(p_category_traffic.findall(response_content)[0])
    except:
        if need_login(response_content):
            print 'login needed'
            return 0
        else:
            print 'no domain traffic data found'
            return ''
    domains = build_dict(iut_domain_title, iut_domain_data)
    domain_detail = ''
    for domain in domains:
        domain_detail = domain_detail + build_domain_detail(domain, task)
    return domain_detail

def get_domain_traffic():
    for index in range(cur_index, len(domain_task)):
        task = domain_task[index]
        print 'working on ' + task['url']
        response = open_url(task['url'])
        if response is None:
            print 'request failed'
            save_run_context(index)
            exit()
        response_content = response.read()
        try:
            iut_domain_title = eval(p_category_title.findall(response_content)[0])
            iut_domain_data = eval(p_category_traffic.findall(response_content)[0])
            page_count = int(p_page.findall(response_content)[0])
        except:
            if need_login(response_content):
                print 'login needed'
                save_run_context(index)
                exit()
            else:
                print 'no domain traffic data found'
                continue
        print 'page count: ' + str(page_count)
        print 'page 1'
        domains = build_dict(iut_domain_title, iut_domain_data)
        domain_detail = ''
        for domain in domains:
            domain_detail = domain_detail + build_domain_detail(domain, task)
        if page_count > 1:
            for page in range(2, page_count+1):
                print 'page ' + str(page)
                detail = get_detail(task, page)
                if detail == 0:
                    save_run_context(index)
                    exit()
                else:
                    domain_detail = domain_detail + detail
        write(domain_detail, domain_result_file, False)

def main():
    login()
    init()
    get_domain_traffic()

if __name__ == "__main__":
    main()
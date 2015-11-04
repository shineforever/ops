#coding=utf8
import re
import os
import sys
import time
import math
import json
import time
import socket
import urllib
import urllib2

TIMEOUT = 30
SLEEP_TIME = 1

class Meilishuo:
    def __init__(self, name):
        self.name = name

        self.task_file = "../../appdata/mogujie.%s.txt" % self.name
        self.log_file = "../../log/mogujie.%s.log" % self.name
        self.break_file = "../../log/breakpoint/mogujie.%s.py.breakpoint" % self.name
        self.dealid_file = "../../result/mogujie.%s.dealid.txt" % self.name

        self.breakpoint = self.get_breakpoint()

        #self.check_dir()

    def check_dir(self):
        if not os.path.exists("log"):
            os.makedirs("log")
        if not os.path.exists("result"):
            os.makedirs("result")
        if not os.path.exists("breakpoint"):
            os.makedirs("breakpoint")

    def get_nids(self):
        nids = []
        fr = open(self.task_file, 'r')
        for line in fr:
            tmp = line.strip().split(',')
            nid = tmp[1]
            nids.append(nid)
        return nids

    def error_record(self, error_type, url):
        log_writer = open(self.log_file, 'a')
        error_time = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time()))
        message = "############################" + '\n' \
                + "TIME: " + error_time + '\n' \
                + "ERROR TYPE:" + error_type + '\n' \
                + "URL: " + url + '\n' \
                + '############################' + '\n'
        log_writer.write(message)
        print message

    def get_breakpoint(self):
        breakpoint = []
        try:
            fw = open(self.break_file, 'r')
            line = fw.readline().strip()
            if line:
                tmp = line.split(',')
                if len(tmp) is not 3:
                    return []
                else:
                    breakpoint = [tmp[0], int(tmp[1]), int(tmp[2])]
        except Exception, e:
            pass

        return breakpoint

    def get_written_deal_id(self):
        deal_ids = set()
        fw = open(self.dealid_file, 'r')
        for line in fw:
            deal_id = line.strip()
            deal_ids.add(deal_id)
        return deal_ids

    def save_breakpoint(self, task):
        fw = open(self.break_file, 'w')
        break_string = task[0] + ',' + str(task[1]) + ',' + str(task[2]) + '\n'
        fw.write(break_string + '\n')

    def get_request(self, url, method="GET", isApp=0, isAjax=0, port=80):
        req = urllib2.Request(url)
        req.add_header("Accpet-Language","zh-CN,zh;q=0.8,en;q=0.6")
        if method == "POST":
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

        if isApp:
            req.add_header("User-Agent", "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)")
        else:
            req.add_header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
            #req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36")

        if isAjax:
            req.add_header("X-Requested-With", "XMLHttpRequest")

        return req

    def request_data(self, request, param={}):
        param = urllib.urlencode(param)
        retry = 10
        data = ''
        for _ in range(retry):
            if not data:
                try:
                    response = urllib2.urlopen(request, param, timeout=TIMEOUT)
                    data = response.read()
                except urllib2.URLError, e:
                    print e
                except socket.timeout, e:
                    print e
                except socket.error, e:
                    print e
        return data

    def get_deal_id(self):
        nids = self.get_nids()
        dealid_writer = open(self.dealid_file, 'a')
        deal_ids = self.get_written_deal_id()

        url = "http://www.mogujie.com/book/%s/%s/%d"
        ajax_url = "http://www.mogujie.com/book/ajax"
        continue_flag = 1

        print 'Begin:', self.breakpoint
        for nid in nids:
            print "[GET] nid: %s" % nid
            page_max = 100
            page_total = 0
            page_stop_flag = 0

            for page_num in range(1, 101):
                #到达最后一页或者该页内容为空或者只有一页内容，则跳出循环
                if page_num > page_max or page_stop_flag:
                    break
                #判断页码总数是否已得出，得出则按该数值决定循环结束位置
                if page_total and page_num > page_total:
                    break

                task = [nid, page_num, 1]
                #判断是否到达断点
                if continue_flag:
                    if not self.breakpoint or (nid == self.breakpoint[0] and page_num == self.breakpoint[1]):
                        continue_flag = 0
                    else:
                        continue
                self.save_breakpoint(task)

                first_url = url % (self.name, nid, page_num)
                request = self.get_request(first_url)
                html = self.request_data(request)
                #返回数据为空，则爬取下一页
                if not html:
                    self.error_record("HTML EMPTY", request.get_full_url())
                    continue
                #匹配script中的book参数，匹配不成功，则爬取下一页
                pattern = re.compile(r'",book:"(.*?)",')
                m = re.search(pattern, html)
                if m:
                    book = m.groups()[0]
                else:
                    time.sleep(SLEEP_TIME)
                    continue

                for section_num in range(1, 11):#
                    task = [nid, page_num, section_num]

                    #判断是否到达断点
                    if continue_flag:
                        if task == self.breakpoint or not self.breakpoint:
                            continue_flag = 0
                        else:
                            continue
                    self.save_breakpoint(task)

                    request = self.get_request(ajax_url, "POST", 0, 1)
                    param = {'location': self.name, 'book': book, 'section': section_num}
                    json_string = self.request_data(request, param)
                    #返回数据为空，则爬取下一个section
                    if not json_string:
                        self.error_record("JSON DATA EMPTY", request.get_full_url())
                        continue
                    else:
                        try:
                            json_data = json.loads(json_string)
                        except Exception, e:
                            self.error_record("JSON LOADS", first_url)
                            continue
                        if not json_data:
                            continue

                        result = json_data.get('result')
                        #result为空，则爬取下一个section
                        if type(result) is not dict:
                            continue
                        end_flag = result.get('isEnd')
                        #该页无内容，isEnd：null，直接跳出循环，爬取下一个nid
                        if end_flag is None:
                            page_stop_flag = 1
                            break
                        else:
                            section_end = end_flag

                        item_list = result.get('list')
                        #如果返回list为null而非[]，则page_num超出总页码，直接跳出循环，爬取下一个nid
                        if type(item_list) is not list:
                            page_stop_flag = 1
                            break
                        for item in item_list:
                            deal_id = item.get('tradeItemId')
                            sale_num = item.get('sale')
                            create_time = item.get('created')
                            if create_time:
                                local_time = time.localtime(float(create_time))
                                create_time = time.strftime('%Y-%m-%d %H:%M:%S',local_time)
                            #print deal_id,
                            if deal_id and deal_id not in deal_ids:
                                deal_ids.add(deal_id)
                                dealid_writer.write(deal_id + ',' + str(sale_num) + ',' + create_time + '\n')
                        #print '\n'

                        if section_end:
                            #页码总数求得后，不再重复求
                            if page_total:
                                break
                            pagination = result.get("pagination")
                            #到达最后一个section，如果pagination为空，则该nid只有一页内容，直接跳出循环，爬取下一个nid
                            if not pagination:
                                page_stop_flag = 1
                                break
                            pattern = re.compile(r'<a href=".*?">(.*?)</a>')
                            page_list = re.findall(pattern, pagination)
                            if page_list:
                                if len(page_list) > 1:
                                    try:
                                        page_total = int(page_list[-2])
                                        print "\tpage_total: ", page_total
                                    except Exception, e:
                                        self.error_record("PAGE TYPE ERROR", first_url)
                                        #如果第一页未提取出page数据，总页数为2页，则会出现<,1,2，则page_total提取为<，跳出循环，爬取下一个nid
                                        page_stop_falg = 1
                                        break
                            break

                if not continue_flag:
                    print "\t\tpage: %d, dealid_num: %d" \
                            % (page_num, len(deal_ids))
                    #time.sleep(2)

        dealid_writer.close()

    def get_nt(self):
        URL = "http://www.meilishuo.com/guang/catalog/shoes"
        req = urllib2.Request(URL)
        req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36")
        html = urllib2.urlopen(req).read()
        script = pq(html)("script:contains('fml.setOptions')").text()
        pattern = re.compile(r"nt : '(.*?)'")
        m = re.search(pattern, script)
        if m:
            nt_hash = m.groups()[0]
        else:
            sys.exit("no hash")

    def run(self):
        self.get_deal_id()


if __name__ == "__main__":
    category = sys.argv[1]
    meilishuo = Meilishuo(category)
    meilishuo.run()

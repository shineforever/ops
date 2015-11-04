import re
import os
import sys
import math
import json
import time
import socket
import urllib2

TIMEOUT = 10

class Meilishuo:
    def __init__(self, name):
        self.name = name
        
        self.task_file = "../../appdata/meilishuo.%s.txt" % self.name
        self.log_file = "../../log/meilishuo.%s.log" % self.name
        self.break_file = "../../log/breakpoint/meilishuo.%s.py.breakpoint" % self.name
        self.dealid_file = "../../result/meilishuo.%s.dealid.txt" % self.name
        
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
        error_time = time.strftime('%Y-%m-%d',time.localtime(time.time()))
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
                if len(tmp) is not 4:
                    return []
                else:
                    breakpoint = [tmp[0], tmp[1], int(tmp[2]), int(tmp[3])]
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

    def save_breakpoint(self, nid, price, page_num, frame_num):
        fw = open(self.break_file, 'w')
        break_string = nid + ',' + price + ',' + str(page_num) + ',' + str(frame_num) + '\n'
        fw.write(break_string)

    def get_deal_id(self):
        nids = self.get_nids()

        dealid_writer = open(self.dealid_file, 'a')

        url = "http://www.meilishuo.com/aj/getGoods/catalog?frame=%d&page=%d&view=1&word=0&section=boom&price=%s&nid=%s"
        price_range = ["0~100", "101~200", "201~500", "500~10000"]
        frame_size = 8
        continue_flag = 1

        deal_ids = self.get_written_deal_id()

        print 'Begin:', self.breakpoint

        for nid in nids:
            print "[GET] nid: %s" % nid
            for price in price_range:
                print "\tprice: %s" % price
                page_num = 0
                page_total = 75
                total_num = 'unknown'

                while page_num <= page_total:
                    for frame_num in range(frame_size):
                        task = [nid, price, page_num, frame_num]

                        if continue_flag:
                            if task == self.breakpoint or not self.breakpoint:
                                continue_flag = 0
                            else:
                                continue

                        self.save_breakpoint(nid, price, page_num, frame_num)

                        single_url = url % (frame_num, page_num, price, nid)
                        req = urllib2.Request(single_url)
                        req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36")
                        try:
                            response = urllib2.urlopen(req, timeout=TIMEOUT)
                        except urllib2.URLError, e:
                            self.error_record("URLError", single_url)
                            continue
                        except socket.timeout, e:
                            self.error_record("TIMEOUT", single_url)
                            continue

                        json_string = response.read()
                        if not json_string:
                            self.error_record("EMPTY JSON RETURN", single_url)

                        try:
                            json_data = json.loads(json_string)
                        except Exception, e:
                            self.error_record("JSON LOADS", single_url)
                            continue

                        try:
                            total_num = int(json_data['totalNum'])
                            page_total = total_num / 160
                            tInfo = json_data['tInfo']
                            for ti in tInfo:
                                deal_id = ti['twitter_id']
                                if deal_id not in deal_ids:
                                    deal_ids.add(deal_id)
                                    dealid_writer.write(deal_id + '\n')
                        except Exception, e:
                            self.error_record("JSON PARSE", single_url)

                    if not continue_flag:
                        print "\t\tpage: %d, dealid_num: %d, page_total:%d, dealid_total_in_this_page: %s" \
                                % (page_num, len(deal_ids), page_total, total_num)
                        #time.sleep(2)
                    page_num += 1

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

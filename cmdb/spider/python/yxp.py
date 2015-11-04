#coding:utf8
# encoding: utf-8

import urllib
import urllib2
import time
import json
import time
from pyquery import PyQuery as pq


import sys
reload(sys)
sys.setdefaultencoding('utf-8')


cookie=r'sto-id-20480=AMGEBAKMFAAA; isShowUpd=isShowUpdLog14610=1; Hm_lvt_ba6c9b2e42a10e9b1ab56a2c104f1dae=1426143177,1426485687; Hm_lpvt_ba6c9b2e42a10e9b1ab56a2c104f1dae=1426485687; ASP.NET_SessionId=554mnsnlfl0i5sz535yr1vv1; jugeFirst=0; .ASPXAUTH=0906076ACEB7DE786B748EE0A84047601BF71A38E4058423C1A7ECB9560FDFC7D2A8572EF93C0FD9769E9EDEC9AEC1181550E1EA7D2605688194CE2A3469DDA5; TranstarAuction=loginname=6Bzfzna63ao=; Hm_lvt_5596319193662c5eba5ac2792ccb4e1b=1426144757,1426485696; Hm_lpvt_5596319193662c5eba5ac2792ccb4e1b=1426520264; RT=dm=i.youxinpai.com&si=678cc5b3-b9a5-4103-bc13-8ea6fb4f632f&ss=1426495008342&sl=36&tt=48894&obo=0&bcn=%2F%2F36fb619d.mpstat.us%2F&nu=&cl=1426520269970&r=http%3A%2F%2Fi.youxinpai.com%2Fauctionhall%2Flist.aspx&ul=1426520269983'

URL = r'http://i.youxinpai.com/AjaxObjectPage/SellCarTypePageTrade.ashx?carAreaID=40'

series_ajax_url_pattern = r'http://i.youxinpai.com/AjaxObjectPage/NewCarTypePageTrade.ashx?carProducerID=%s'

tradelist_url = r'http://i.youxinpai.com/TradeManage/tradelist.aspx'

def get_html():
    print u'开始'
    req = urllib2.Request(URL)
    req.add_header('Cookie', cookie)
    html = urllib2.urlopen(req).read()
    text = unicode(html, "utf-8")
    htmlPq = pq(text)("li")
    # print htmlPq
    
    flag = 0
    for i in range(len(htmlPq)):
        brand_num = htmlPq.eq(i)('a').attr['onclick'].strip('SelectCar()').split(',')[0].strip('\'')
        print brand_num
        if brand_num == '1000000004':
            flag = 1
        if flag == 0:
            continue
        series_ajax_url = series_ajax_url_pattern % brand_num
        req = urllib2.Request(series_ajax_url)
        series_html = urllib2.urlopen(req).read()
        series_text = unicode(series_html, "utf-8")
        try:
            series_htmlPq = pq(series_text)("li")
        except:
            continue
        series_flag = 1
        if brand_num == '1000000027':
            series_flag = 0
        for j in range(len(series_htmlPq)):
            series_num = series_htmlPq.eq(j)('a').attr['onclick'].strip('SelectCars()').split(',')[0].strip('\'')
            print series_num
            if series_num == '100001465':
                series_flag = 1
            if series_flag == 0:
                continue
            getDetail(series_num,brand_num,1)

    print u'结束'


formdata = {
                '__EVENTTARGET':"",
                '__EVENTARGUMENT':"",
                '__VIEWSTATE':'',
                '__SCROLLPOSITIONX':'0',
                '__SCROLLPOSITIONY':'200',
                'hid_csid':'',
                'hid_bsid':'',
                'ctl00$ContentPlaceHolder_Body$hid_csid_server':'',
                'ctl00$ContentPlaceHolder_Body$hid_bsid_server':'',
                'ctl00$ContentPlaceHolder_Body$hid_search':'',
                'hid_select':'宝马 -> X5',
                'ctl00$ContentPlaceHolder_Body$ccPager_input':''
}


def getDetail(series_num,brand_num,pidx):
        fw = open('../result/yxp2.txt', 'a')
        print 'current page: ' + str(pidx)
        if pidx==1:                
            formdata['hid_csid']=series_num
            formdata['hid_bsid']=brand_num
            formdata['ctl00$ContentPlaceHolder_Body$Button1']=''
            formdata['__VIEWSTATE']='/wEPDwUKMjA0NjM5NzExNg9kFgJmD2QWBAIDD2QWBAICDxYCHgdWaXNpYmxlaGQCAw8WAh4EaHJlZgUzL0FncmVlbWVudExvZ2luL0J1eWVySGVscC9TZW5pb3IvaGVscF96eWJ1eWVyMS5odG1sZAIFD2QWAmYPZBYGAgcPFgIfAGhkAgsPFgIfAGhkAg8PFgIfAGhkZA=='
        tradelist_req = urllib2.Request(tradelist_url, urllib.urlencode(formdata))
        tradelist_req.add_header('Cookie', cookie)
        try:
            tradelist_html = urllib2.urlopen(tradelist_req).read()
        except:
            getDetail(series_num,brand_num,pidx)
            return
        tradelist_text = unicode(tradelist_html, "utf-8")        
        count = pq(tradelist_text)("#ctl00_ContentPlaceHolder_Body_div_count strong").text()
        if not count:
            print u'no data'
            return
        print count
        tradelist_htmlPq = pq(tradelist_text)("#tbody_data")('tr')
        inputs = pq(tradelist_text)("#aspnetForm input[type='hidden']")
        for i in range(len(inputs)):
            key = inputs.eq(i).attr("name")
            val = "" if inputs.eq(i).val() is None else inputs.eq(i).val()
            if key is not None:
                formdata[key]=val
        for k in range(len(tradelist_htmlPq)):
            #print k
            tradelist_td_htmlPq = tradelist_htmlPq.eq(k)('td')
            for m in range(len(tradelist_td_htmlPq)):
                if(m == 2):
                    fw.write(tradelist_td_htmlPq.eq(m).attr['title'].strip().split(' ')[0].encode('utf8'))
                    fw.write(',')
                    try:
                        fw.write(tradelist_td_htmlPq.eq(m).attr['title'].strip().split(' ')[1].encode('utf8'))
                        fw.write(',')
                    except:
                        fw.write(',')
                else:
                    fw.write(tradelist_td_htmlPq.eq(m).text().encode('utf8'))
                    fw.write(',')
            fw.write('\n')
        fw.close()    
        
        # time.sleep(3)
        
        if pidx*10<int(count):
            pidx=pidx+1
            print pidx
            if 'ctl00$ContentPlaceHolder_Body$Button1' in formdata.keys():
                print 'deleting property from formdata'
                del formdata['ctl00$ContentPlaceHolder_Body$Button1']
            formdata["__EVENTTARGET"]='ctl00$ContentPlaceHolder_Body$ccPager'
            formdata["__EVENTARGUMENT"]=pidx
            formdata['ctl00$ContentPlaceHolder_Body$ccPager_input']=pidx-1
            getDetail(series_num,brand_num,pidx)
        else:
            print 'finish all pages for [brand_num:%s, series_num:%s]' % (str(brand_num), str(series_num))


def main():
    get_html()
    # getDetail(100002081,1000000018,1)

if __name__ == "__main__":
    main()

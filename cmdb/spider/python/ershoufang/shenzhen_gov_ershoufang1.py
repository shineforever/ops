# _*_ coding: utf-8 _*_

import os
import sys
import urllib
import urllib2
import chardet
from pyquery import PyQuery as pq

count_by_user_url = 'http://ris.szpl.gov.cn/credit/showcjgs/esfcjgs.aspx'
top_ten_url = 'http://ris.szpl.gov.cn/credit/showcjgs/esfTop10.aspx'

def get_result_path():
    return os.path.dirname(os.path.abspath(__file__)).replace('python/ershoufang', 'result')

def get_count_by_user_html(city):
    request = get_request(count_by_user_url, method='POST')
    param = {
            'ctl00$ContentPlaceHolder1$scriptManager1': 'ctl00$ContentPlaceHolder1$updatepanel1|ctl00$ContentPlaceHolder1$hyp%s' % city,
            '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$hyp%s' % city,
            '__VIEWSTATEGENERATOR': '31DDE154',
            '__VIEWSTATE': "\
tGS4Qd2XB7YJKF3/emMGrZxfq6P3pxvy3XKDKxrzsahOJkgjLdOcBB7Be42g7RLvPx6EAQswzrSjVAW0nSrWtOrt7an7MzMVaru\
G9UnrwDjkzlOzFwp/UwmQxXepB1Lf9tyNYURpE/rQJura+meFSdYpZJAiN9NwdfeH/l+ggfZ+nh1zrDBx9WSSytkr04e10/q6/W7GAr/fQ2P\
hK6c72olWfNCoRztdt65yI8a1SawVU3IzQo7+iy8VDO3r/cYD3kYhqQ1CpbRjqNKR8XEIF0jHH64/qQfEOEPt8EYBcw8PcT1rsR0mXYWnNKs\
LGkez1Ix4Ldbn7iLj40jlPAv5CAT/NsUE01SKD8aqLOIbgUM9yQ/2CuQ6Z/elZvq5PTdI2otz9hUNpjkdLhP80TXpH6mYgQS8f8KnyiW9YRn\
vRO9mltaWErzSWfQZ7f2QlwDCCg0KxUGed/DYGyEion6m8JHSo3J0Ayo3STuBvcVH2PGIetaEQEVnCDK1viKVNkEAxHboqesfDMFPFQLZqfT\
Pes3ngyOSpgbJKVlfcLv3ZHmtTEdwhor+VlyIVZAjKzRmNwPrwacIuD1+wU1q8BjBK47G4KHvPd0dwh9SdxGf4NPM+MnoFKxQh8uYRRd7BYu\
5aw8AC44MNPEw3qmWS5w4lKSrVaPC0/d0Vho4lyXYHoMjkeWkQniLXRU14Vv2uAfIsjDTClX+n6y5k6adVMBMLnMzQghkW5MsY7QoZGDDPFN\
MfdPFgIZkgu3pqq6CZAkN5QYZi5cXWZjWmoLA0aDFKUVlH0Jlv4/FyTNseoOjq+yQPxqkg3a6CDphkuDTrTgOQtUuLb7ucSlFkF2X3cJ2Qdz\
wy3tqiWl1Z4F9ZIaR/9v4n3MBd6VDtK5ldRnTEb4gUwyVsom4DUGpeswwWHcebd7gzhL14fuU3qyUSftJQv8xk2SfCJRqWkZBi+8oHHvrGoj\
jhhFmuy2jhRyq3jSkRvksBO6RfWxPNzvxo9j8bTCI6EMNUosl1Odlkn3TuCki+jnArk0E7SUNWVVlvpSvOmZ7v9tfYpPGpWrhj8+LyWSSVyK\
OYv9dZ75HiB3/OU7yBplZHvtPpr0TVl2Ua7jhKdjWMq2p61ZhH0uO0CAW+4jIVK1CgbNVcgFKeaNP5Oi3+hMINCB5xtdUCS6VhfuXVy1+YRV\
mLsSITDSYX2R/aGGlDYKwTJPb5B2cpiIJPU7rZNs/Q1gNFUpDoWogZ039CZpP4SRXXUluSmgioPpFlv3I/IaPEnns+05TpzZYHxajB5SbL0F\
7eynANf1zd2m3CJyvUg0+IQD4dQAavSKw33DcPEzXfWOPYodrP6jmqvK09xDBlocaDUbIBow2nxtJJSH1wqRaVdSjx4l3vyQp8kIWpXq/Jhm\
vuTPJx33vb/Y6i7ygp+lf3jLTeCe4keA9cSCdGkgAV8onQg0ZJKGhMUB/OrzabyiLx6++tfW5XojoystbjO/3QS6TjbxAp2U5uM7/P7WzpG7\
Q7pADcyBTEjWfnERgoI+1T3emIwCLEluIx2CGbTt0UQR9fB70wzNdUUYwuXGzuTtgqlZ6w84RFPKi7kYoGRcRdjh0ocYWBxuat16ljPPTta2\
hhBJbMva3efiEyd1ngwanZNAisbDi5hghK/TM93Z9d1sPaF7i1vfdJPu6K0sdwgyppiGolFeFU4A33m1YN5AKugOnaHBzdlDHiH4so88zGW+\
8jvN9iYCiXK7bSmlVuul7FZkQKpxEmoTH3T/U0zAORbh/4P+37ca+8di682gDFLEVD6UBBamD2FP5UGh8MF5k/ZnR7gVixe+icXqylj6kJtD\
t4nnQ5vLv31mgScsYi4bh9H885RL6fKZ8A4YV4+JS+5WxL+2brPvMsH2pWn/uLU2o81NKq30iKu2+5evANMxFznMvZ5HHey5pd29jEo/b6Un\
6hY3ZFK6jiEvUv9CyJkvH66yhT6SeKJdtcptAEYCDD81DGT7+5vYExfBRPpktLM0cfqtkbok551Tb98EkZ8HmFL3rSKEEVD7zkNI8C+wqUD+\
Qb576QsasHX3h/EJJOxh6ER8OCeM9LCYh8OIIY2cr3u7A3auer6QarMhibnv7poJYRxD+uUnGAv4aslZVr/Fy7qH/xKQP9kGDXrQ64OpFlpb\
Lm/4uGmkzUnJhkGFj6qpMm1grRDr39xmzpuAyBvyhGXU88Zo7TnEuiA7LlEw3PrnkANsf1AYMwvA8169MkyiWKXwVJNnod/iH+PiFSuZ5WTt\
XD2NlTHScca3FOU7wRmMdHdJYWOhZEh2NfqCnxphiB2pW1LVx47LqJ9DGEa8eusf33ZxC8aCiUbwEUz3YA1vwF5/b5iwjiEfo2ink/bSupMr\
hS75j4VlXn4G8nka6ZEFQ7KSKHKQM6wtKpmYOnIA6ZW8V0sJVXqglGCm8Cvy4z2Nuy7PNODi9Nl8rc75o5x0+bX2LjBPAETpSGYwSvIRk8fi\
+okH1s0YFPKNrDjA3JpuDSKPDK9YuduNRS2r0pfb2jQ9Ik1mAAAAOYInTQ/dKCFRkJBE+9VjFQm3bXu5ixmebPHQLpBCC4luPpCO3i/JaeAq\
pukys8MUVqYMzPzv5O/0ycPhk1Q6gr59fbzFAyjzjq6EkoUL7vuSfa+fS0jCDeSRZAB5bWUZi+NuS6VUUvgA/j2zMTWiMyHJVEAH9ASMCCJL\
ZAo+jLco+RlG4J/22aLMOozmMnAvqNhl4Bo27nwUA4mrmGwiKQx/VMpxAdHnFDfB53SI4gs786SZoAarLhSyAJJGuz5UZrBuG2hGeiLBwkDW\
KyZILjAZRS8egG9swAlqq2mY+7JuVA3z2CJt7+LVYTNNSjLrzNfYmNsfGQcvdj+OdS/Xiav/NG/2kWocdUPt9lze5MBRKwf1Ez8xMchD4bsg\
xs6G/V8gpplM/GrBp8wxKf+MUBKtN2vW2avLF0Zqw//jnicjostUYllF4ryYYCG39SjLGgZMqXWe65sN25Uf4h0Lb7f2vgOEgHcczt/KmMKh\
/neUjJt/tSHgCX8RlYaHbHWvV6RqtwJwVNmTFvT+iPBlaooJxQlzigemAimu0kzPQJu2N++RryFG4TQRgXLHr8/XMDBqzTp+LEYAv9dcz1ND\
rJbMA3ZeH/YijxmI2MH+ruZLuzox4Ihu2ybfCmW88jOR46nMriH+Pn2o0mt97TZg/wTFTEwFWOtGjoG9GLtJvT/TDgcK2S2IVLo5vms8uP22\
y2GXJwmA+EgRNQNMm7dUKs4yKRdpLbf8lGviBiPFs57jgV88WjvwL0l78U4ebvwSv+kU93P7GygD5GfosZMqMyuftcAGwDGvX2RLQ+b7v/CO\
Azo5YS/tox8PnLoLtWChIM1KvLFI8gI8hWNVj+ZQy9CuoXGsW3o28z00WK33MWz0a9qex8+sREPoGAGUUrFjD2E12dYSLNn/CTC09WmUT8If\
L9w2Cjuy5UjqytvTwxJ3QGGQx501I0ETbqOY=",
            '__EVENTVALIDATION': '9QnEUq4YhTyifKqJ8sI6lShA+XD6+pqXl3BOl+mq9ZQa4uhfOAn2h8TKg2XUQzJRDudbQVen1Ak7Ubv0DGZ+DCLtGfQOzSHuZ9A0d4tWsakRMwYI0JD2jHhTC/R+DE0CwumiYw2/1NScL+EzNI8Y8qBnVR0=',
            '__EVENTARGUMENT': '',
            '__VIEWSTATEENCRYPTED': ''
    }
    return request_data(request, param)

def get_top_ten_html(city):
    request = get_request(top_ten_url, method='POST')
    param = {
            'scriptManager1': 'updatepanel1|hyp%s' % city,
            '__EVENTTARGET': 'hyp%s' % city,
            '__EVENTARGUMENT': '',
            '__VIEWSTATE': "\
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\
bSYnnbhyT2nrY7jrEC8sl1ZzdAQ==",
            '__VIEWSTATEGENERATOR': '652589E4',
            '__VIEWSTATEENCRYPTED': '',
            '__EVENTVALIDATION': 'FOP7SjVd8Js5vSVbD+dxGJVDsU+aXu/zwzkOM21jGQNfWGr4d68FBJRXbdbkSxmzdRNFtHWoAAAEpqH+ipLl0R2q6vJHj/sg0u/ikMrc6U6NfFSKC2H7lwoOCfKjJDtUY1PeYuL4tqNDeN3UhA6m1VCY2UY=',
    }
    return request_data(request, param)

def get_request(url, method="GET", isApp=0, isAjax=0, port=80):
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

def request_data(request, param={}):
    param = urllib.urlencode(param)
    data = ''
    response = urllib2.urlopen(request, param)
    data = response.read()
    return data

def parse_count_by_use(html, city):
    #dir_name = get_result_path()
    file_name1 = os.path.join(dir_name, 'shenzhen_gov_ershoufang_count_by_use_day_region.txt')
    file_name2 = os.path.join(dir_name, 'shenzhen_gov_ershoufang_count_by_use_month_region.txt')
    table1 = pq(html)("#ctl00_ContentPlaceHolder1_clientList1 tr")
    table2 = pq(html)("#ctl00_ContentPlaceHolder1_clientList2 tr")
    date1 = pq(html)('#ctl00_ContentPlaceHolder1_lblCurTime1').text()
    date2 = pq(html)('#ctl00_ContentPlaceHolder1_lblCurTime2').text()
    infos1 = infos2 = ''
    if os.path.exists(file_name1):
        fr = open(file_name1, 'r')
        infos1 = fr.read().decode('utf8')
        fr.close()
    if os.path.exists(file_name2):
        fr = open(file_name2, 'r')
        infos2 = fr.read().decode('utf8')
        fr.close()
    #print len(table1)
    #print len(table2)
    info1 = get_info(table1, date1, city)
    #print 'table2'
    info2 = get_info(table2, date2, city)
    #print 'end table2'
    if date1 + ',' + city not in infos1:
        fw1 = open(file_name1, 'a')
        fw1.write(','.join(info1).encode('utf8') + '\n')
        fw1.close()
    #print 'end date1'
    if date2 + ',' + city not in infos2:
        fw2 = open(file_name2, 'a')
        fw2.write(','.join(info2).encode('utf8') + '\n')
        fw2.close()
    #print 'end count'

def get_info(table, date, city):
    info = ['','','','','','','','','','',date,city]
    try:
        for tr in table:
            tds = pq(tr)('td')
	    #print 'tds:',len(tds)
            title = tds.eq(0).text()
            if title == u'商业':
                info[0] = tds.eq(1).text().strip()
                info[1] = tds.eq(2).text().strip()
            elif title == u'住宅':
                info[2] = tds.eq(1).text().strip()
                info[3] = tds.eq(2).text().strip()
            elif title == u'其他':
                info[4] = tds.eq(1).text().strip()
                info[5] = tds.eq(2).text().strip()
            elif title == u'办公':
                info[6] = tds.eq(1).text().strip()
                info[7] = tds.eq(2).text().strip()
            elif title == u'小计':
                info[8] = tds.eq(1).text().strip()
                info[9] = tds.eq(2).text().strip()
    except Exception , e:
        print "error in getinfo"
        print e    
    return info


def parse_top_ten(html, city):
    #dir_name = get_result_path()
    file_name = os.path.join(dir_name, 'shenzhen_gov_ershoufang_top_ten_region.txt')
    html = html.decode('utf8')
    trs = pq(html)('#divTable table tr')
    date = trs.eq(0).text().strip(u'深圳市').split(u'日')[0] + u'日'
    infos = ''
    #print 'top10'
    if os.path.exists(file_name):
        fr = open(file_name, 'r')
        infos = fr.read().decode('utf8')
        fr.close()
    #print 'af infos'
    if date + ',' + city not in infos:
        fw = open(file_name, 'a')
        #print 'date not exist', len(trs)
        for i in range(2, len(trs)):
            tds = trs.eq(i)('td')
            #print i,len(tds)
            try:
                name = tds.eq(0).text()
                num = tds.eq(1).text()
                area = tds.eq(2).text()
                if name:
                    #print name
                    info = [date, city, name, num, area]
                    for i in range(len(info)):
                        #charcode = chardet.detect(info[i])
                        #print 'encoding:', charcode['encoding']
                        info[i] = info[i].encode('utf8')
                    fw.write(','.join(info) + '\n')
            except Exception, e:
                print 'error in top10'
                print e
        fw.close()
    #print 'end top10' 


def run():
    for city in ['Ba', 'Ft', 'Lg', 'Lh', 'Ns', 'Yt']:
        print city
	count_by_user_html = get_count_by_user_html(city)
        parse_count_by_use(count_by_user_html, city)
        top_ten_html = get_top_ten_html(city)
        parse_top_ten(top_ten_html, city)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print 'usage: python shenzhen_gov_ershoufang1.py [path of result]'
    else:
        #print sys.getdefaultencoding()
        reload(sys)
        sys.setdefaultencoding('utf8')
        #print sys.getdefaultencoding()
        global dir_name
        dir_name = sys.argv[1]
        #print dir_name
        run()





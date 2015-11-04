# _*_ coding: utf-8 _*_

import urllib2
import re
from pyquery import PyQuery as pq


url = 'http://www.tujia.com/se0/?utm_source=baidu&utm_medium=cpc&utm_term=bdpztitle'
html = urllib2.urlopen(url).read()

html_pq = pq(html)
pattern = 'var cityInfo = ({.*})?;\s*</script>'
m = re.search(pattern, html)
result = m.groups()[0]
with open('tujia.city.txt', 'w') as fw:
    fw.write(result)

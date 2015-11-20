#-*-coding:utf8-*-

from multiprocessing.dummy import Pool as ThreadPool
import requests
import time

def getsource(url):
    html = requests.get(url)

urls = []

for i in range(1,21):
    newpage = 'http://tieba.baidu.com/p/3522395718?pn=' + str(i)
    urls.append(newpage)

time1 = time.time()
for i in urls:
    print i
    getsource(i)
time2 = time.time()
print u'单线程耗时：' + str(time2-time1)

pool = ThreadPool(4)
time3 = time.time()
results = pool.map(getsource, urls)
pool.close()
pool.join()
time4 = time.time()
print u'并行耗时：' + str(time4-time3)


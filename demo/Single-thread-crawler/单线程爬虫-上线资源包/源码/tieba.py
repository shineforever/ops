#-*-coding:utf8-*-
import requests
html = requests.get('http://tieba.baidu.com/f?ie=utf-8&kw=python')
print html.text

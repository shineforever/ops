import urllib2
response=urllib2.urlopen('http://www.itzcn.com/')
html=response.read()
print html

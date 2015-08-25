import urllib ,sys  
import re  
provice=raw_input('输入省名(请使用拼音):');  
major=raw_input("输入市名(请使用拼音):")  
url="http://qq.ip138.com/weather/"+provice+'/'+major+'.htm' 
print url  
try: 
    wetherhtml=urllib.urlopen(url)  
    result=wetherhtml.read().decode('GB2312')#.encode('utf-8')  
    #result=result.replace("gb2312","utf-8")  
    f=file('weather.txt','w')  
    f.write(result.encode('GB2312'))  
    f.close()  
except Exception,e:
    print e
else:
    pattern='Title.+<b>(.+)</b>' 
    Title=re.search(pattern,result).group(1)  
    pattern='>(\d*-\d*-\d*.+?)<' 
    date=re.findall(pattern,result)  
    pattern='alt="(.+?)"' 
    weather=re.findall(pattern,result)  
    pattern='<td>([-]?\d{1,2}.+)</td>' 
    temperature=re.findall(pattern,result)    
    print "%35.30s"%Title,""  
    length=len(date)  
    for i in range(length):  
        print '%30.20s'%date[i],'\t%s'%weather[i],'\t%s'%temperature[i] 


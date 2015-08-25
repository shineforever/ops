from django.http import HttpResponse
import random
def random_number (request):
    randNums = ''
    for num in range(10):
          randNums=randNums+str(random.randint(num,10-1))+'<br/>'
    htmlStr='''
    <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>无标题文档</title>
        <style type="text/css">
        <!--
        body,td,th {
	                font-family: 华文行楷;
	                font-size: 24px;
       }
       -->
       </style></head>
       <body>
            生成的随机数为<br/>%s'''%randNums+'''
          
       </body>
    </html>
    '''
    return HttpResponse(htmlStr)



       

    

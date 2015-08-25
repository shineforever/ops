from django.http import HttpResponse
from django.shortcuts import render_to_response
from Django_Pro.Users.models import Users
from django.http import HttpResponseRedirect
from Django_Pro.Products.models import Products
from django.template import RequestContext 
from Django_Pro.Fruit.models import Fruit



def home (request):
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
            欢迎进入窗内网的主页
       </body>
    </html>
    '''
    return HttpResponse(htmlStr)

def login (request):
    username=request.GET.get('username',None)
    password=request.GET.get('password',None)
    if username is not None:
        usersList=Users.objects.all()
        for users in usersList:
            if users.username == username and users.password == password:
                request.session['username']  = username
                return render_to_response('login.html',{'username':username})
    return render_to_response('login.html')

def  proList (request):
    pros=Products.objects.all()
    return render_to_response('pro_index.html',{'pros':pros})
def buyPro (request):
    proId=request.GET.get('proId',None)
    if proId > 0:
        pro=Products.objects.get(id=proId)
        request.session['pro']=pro
        return render_to_response('showBuy.html',context_instance=RequestContext(request))
    return render_to_response('showBuy.html')
def fruitList (request):
    fruits=Fruit.objects.all()
    return render_to_response('fruit_list.html',{'fruits':fruits})
    
    

    
    
    
   
     
        

    
    


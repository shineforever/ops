from django.shortcuts import render_to_response
from Django_Pro.Users.models import Users

def index(rq):
    latest_users_list = Users.objects.all().order_by('-username')[:5]
    return render_to_response('users/index.html',{
        'latest_users_list':latest_users_list
    })

 


            
           
            
    
    



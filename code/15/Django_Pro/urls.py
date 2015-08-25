from django.conf.urls.defaults import *
from django.contrib import admin
admin.autodiscover()
urlpatterns = patterns('',
    (r'^$', 'views.home'),
    (r'^Users/', include('Django_Pro.Users.urls')),
    #(r'^$', 'Django_Pro.Users.views.index'),
    #(r'^Django_Pro/', include('Django_Pro.foo.urls')),
    #(r'^Users/',include('Django_Pro.Users.urls')),
    (r'^admin/',include(admin.site.urls)),
    (r'^login/$','Django_Pro.views.login'),
    (r'^pro/$','Django_Pro.views.proList'),
    (r'^buy/$','Django_Pro.views.buyPro'),
    (r'^fruit/$','Django_Pro.views.fruitList')
    
)

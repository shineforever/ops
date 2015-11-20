from Django_Pro.Users.models import Users
Users.objects.create(id = 1, username = 'maxianglin' , password = 'maxianglin',realname = '马向林',sex='女',email = 'maxianglin@mxl.com')
Users.objects.create(id = 2, username = 'wanglili' , password = 'wanglili',realname = '王丽丽',sex='女',email = 'wanglili@wll.com')
Users.objects.create(id = 3, username = 'guoli' , password = 'guoli',realname = '郭力',sex='男',email = 'guoli@gl.com')

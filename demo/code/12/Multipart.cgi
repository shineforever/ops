#!D:/Program Files/Python/python.exe
import cgi, os, urllib, md5
print "Content-type: text/html"
print
print """<HTML>
<HEAD>
<TITLE>文件上传</TITLE></HEAD><BODY>"""
form = cgi.FieldStorage()
if form.has_key('file'):    
    fileitem = form['file']
    if not fileitem.file:
        print "出错啦！您上传的文件出错了<P>"
    else:
        print "您上传的文件是: %s<P>" % cgi.escape(fileitem.filename)
        m = md5.new()
        size = 0
        while 1:
            data = fileitem.file.read(4096)
            if not len(data):
                break
            size += len(data)
            m.update(data)
            filename=os.path.split(fileitem.filename) #获得上传文件的名称
            
            file(filename[1],'wb').write(data) #将上传的文件写入到data文件中
        print "接收到的文件有 %d 字节，上传的路径是：%s" %(size,os.environ['SCRIPT_NAME'])
else:
    print "您还没有上传任何文件.<P>"
print """<FORM METHOD="POST" ACTION="%s" enctype="multipart/form-data">
请选择要上传的文件: <INPUT TYPE="file" NAME="file"><br/>
""" % os.environ['SCRIPT_NAME']
print """<INPUT TYPE="submit" NAME="submit" VALUE=" 上 传 ">
</FORM>
</BODY></HTML>"""

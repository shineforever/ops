import socket , select
s=socket.socket()
host=socket.gethostname()
port=1234
s.bind((host,port))
fdmap={s.fileno():s}
s.listen(5)
p=select.poll()       #生成Polling对象
p.register(s)         #注册Socket对象
while True:
    events=p.poll()   #获取准备好的文件对象
    for fd,event in events :
        if fd is fdmap:
            c,addr=s.accept()
            print '获取连接来自：',addr
            p.register(c)
            fdmap[c.fileno()]=c      #加入连接Socket
        elif event & select.POLLIN:
            data=fdmap[fd].recv(1024)
            if not data:          #没有数据
                print fdmap[fd].getpeername(),'disconnected'
                p.unregister(fd)
                del fdmap[fd]
        else:
            print data
           

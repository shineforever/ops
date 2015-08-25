import socket
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
host=socket.gethostname()
port=1234
s.bind((host,port))
s.listen(5)
while True:
    c,addr=s.accept()
    print '连接来自：',addr
    c.send('恭喜你！一个简单的服务器创建成功！')
    c.close()



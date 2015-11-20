import socket
import urlparse
import sys
def httpServer (url):
    u=urlparse.urlparse(url)
    host=u[1]
    page=u[2]
    s=socket.socket()
    port=80
    s.connect((host,port))
    httpCmd='get'+page+'\n'
    s.send(httpCmd)
    print s.recv(1024)
    s.close()
if __name__=='__main__':
    httpServer('http://snaps.php.net/index.php')


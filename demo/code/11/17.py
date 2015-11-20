import asyncore,socket

class AsyncGet(asyncore.dispatcher):
    def __init__(self,host):
        asyncore.dispatcher.__init__(self)
        self.host=host
        self.create_socket(socket.AF_INET, \
                            socket.SOCK_STREAM)
        self.connect((host,80))
        self.request='GET /index.html HTTP/1.0\r\n\r\n'
        self.outf=None
        print 'Requesting index.html from',host

    def handle_connect(self):
        print 'Connect',self.host

    def handle_read(self):
        if not self.outf:
            print 'Creating',self.host
        self.outf=open('%s.txt'%self.host,'wb')
        data=self.recv(8192)
        if data:
            self.outf.write(data)

    def writeable(self):
        return len(self.request)>0

    def handle_write(self):
        num_sent=self.send(self.request)
        self.request=self.request[num_sent:]

    def handle_close(self):
        asyncore.dispatcher.close(self)
        print 'Socket closed for',self.host
        if self.outf:
            self.outf.close()

AsyncGet('www.python.org')
asyncore.loop()

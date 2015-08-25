from SocketServer import TCPServer , ThreadingMixIn , StreamRequestHandler
class Server(ThreadingMixIn , TCPServer):
    pass
class Handler(StreamRequestHandler):
    def handle (self):
        addr=self.request.getpeername()
        print '获取的连接来自：',addr
        self.wfile.write('使用Thead方式实现多连接')
if __name__=='__main__':    
    server=Server(('localhost',1234),Handler)
    server.serve_forever()


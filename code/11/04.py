from SocketServer import TCPServer,StreamRequestHandler
class Handler(StreamRequestHandler):
    def handle (self):
        addr=self.request.getpeername()
        print '获取的连接来自：',addr
        self.wfile.write('恭喜你！连接成功！')
server=TCPServer(('',1234),Handler)
server.serve_forever()

        
    

        
            
    

       
        
    
        
        
        
        

    
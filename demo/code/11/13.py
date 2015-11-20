def send(self, data):
   try:
       result = self.socket.send(data)
       return result
   except socket.error, why:
       if why[0] == EWOULDBLOCK:
           return 0
       else:
           raise
       return 0
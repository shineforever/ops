# coding=utf-8
class Myclass:
    __username=''
    def __init__ (self,username):
        self.__username=username
    def getUserName (self):
        return self.__username
if __name__ == "__main__":
    myclass = Myclass('admin')
    print myclass.getUserName()
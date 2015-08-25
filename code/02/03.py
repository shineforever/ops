class Myclass:   #类名中的每个单词的首字母大写，其它小写
    __username=''   #私有属性前必须使用两个下划线为前缀
    def __init__ (self,username):
        self.__username=username   #self相当于Java语言中的this关键字，表示本类
    def getUserName (self):      #方法名的首字母小写，其后每个单词的首字母要大写
        return self.__username
if __name__ == "__main__":
    myclass = MyClass('admin')      #对象名用小写字母
    print myclass.getUserName()
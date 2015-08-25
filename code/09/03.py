def fileManager ():
    return file('c:\\a.txt', 'r') 
userFile=file('c:\\b.txt','r')
try:
    userFile=fileManager()
    print '打开文件'
finally:
    print '关闭文件'
    userFile.close()



    
    
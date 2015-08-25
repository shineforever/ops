import sys,os  
import urllib  
def downloadPydev(a,b,c):  
    """  
        call back function  
        a,已下载的数据块  
        b,数据块的大小  
        c,远程文件的大小  
    """ 
    print "正在下载，请耐心等待……" 
    prec=100.0*a*b/c  
    if 100 < prec:  
        prec=100 
        print "%.2f%%"%(prec,)    
def main(argv):  
    """  
        main  
    """ 
    print "开始下载……" 
    urllib.urlretrieve("http://cdnetworks-kr-1.dl.sourceforge.net/project/pydev/pydev/Pydev%201.6.5/Pydev%201.6.5.zip"\

                       ,"tmp/python.pydev.zip"\

                       ,downloadPydev)  
    print "下载完成……"         
if __name__=="__main__":  
    main(sys.argv[1:]) 


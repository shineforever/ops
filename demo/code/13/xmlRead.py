import string
from xml.sax import*
class QuotationHandler(ContentHandler):
    def __init__(self):
        self.string=''    
    def startDocument(self):		#开始处理文档时调用
        print '-------开始处理XML文档------'
        print 'name\tprice\taffect'
        print '--------------------------'
    def endDocument(self):					#处理文档结束时调用
        print '-------处理结束XML文档-'

    nameStr=raw_input('请输入你想查看XML文档中的标签（title）：')    
    def startElement(self, nameStr, attrs):
        print '-----------Start Element-----------'
        if nameStr == 'title':
            print '------标签为title下的数据-------'                     
            print attrs['name'],attrs['offer_id'],attrs['mobile_url']              
    def characters(self, ch):        
        self.string = self.string + ch
if __name__ == '__main__':   
    try:
        parser =make_parser()
        handler = QuotationHandler()
        parser.setContentHandler(handler)
        parser.parse("sample.xml")
    except:
        import traceback
        traceback.print_exc()
    
       

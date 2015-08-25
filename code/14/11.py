import wx

class MultiTextFrame(wx.Frame):
    def __init__(self):
        wx.Frame.__init__(self,None,-1,"用户注册界面",
                          size=(500,400))
        panel=wx.Panel(self,-1)
        #创建一个静态文本输入框
        labName=wx.StaticText(panel,-1,'用户名',pos=(50,10))
        #创建一个普通文本输入框
        self.inputText=wx.TextCtrl(panel,-1,'',pos=(120,10),size=(150,-1),style=wx.TE_LEFT|wx.TE_PROCESS_TAB)
        self.inputText.SetInsertionPoint(0)
        labPwd=wx.StaticText(panel,-1,'密码',pos=(50,50))
        #创建一个密码文本输入框，当在密码输入框中按下回车键后触发事件
        self.pwdText=wx.TextCtrl(panel,-1,'',pos=(120,50),size=(150,-1),style=wx.TE_PASSWORD|wx.TE_PROCESS_ENTER)
        #绑定事件
        self.Bind(wx.EVT_TEXT_ENTER,self.OnLostFocus,self.pwdText)
        #普通多行文本输入框
        multiLabel=wx.StaticText(panel,-1,"网络服务协议:",pos=(40,90))
        multiText=wx.TextCtrl(panel,-1,"本协议由您与汇智科技有限公司共同缔结，本协议具有合同效力。\n本协议中协议双方合称协议方，汇智科技网络有限公司在协议中亦称为'汇智'。\n您应当在使用汇智科技网上教学之前认真阅读全部协议内容，对于协议中以加粗字体显示的内容，您应重点阅读。如您对协议有任何疑问的，应向汇智科技咨询。但无论您事实上是否在使用汇智科技服务之前认真阅读了本协议内容，只要您使用汇智科技网上教学服务，则本协议即对您产生约束，届时您不应以未阅读本协议的内容或者未获得汇智科技对您问询的解答等理由，主张本协议无效，或要求撤销本协议。",
                              pos=(120,90),
                              size=(300,100),
                              style=wx.TE_MULTILINE)
        
        #丰富样式的多行文本输入框
        richLabel=wx.StaticText(panel,-1,"网络服务协议:",pos=(40,210))
        richText=wx.TextCtrl(panel,-1,
                             "本协议由您与汇智科技有限公司共同缔结，本协议具有合同效力。\n本协议中协议双方合称协议方，汇智科技网络有限公司在协议中亦称为'汇智'。\n您应当在使用汇智科技网上教学之前认真阅读全部协议内容，对于协议中以加粗字体显示的内容，您应重点阅读。如您对协议有任何疑问的，应向汇智科技咨询。但无论您事实上是否在使用汇智科技服务之前认真阅读了本协议内容，只要您使用汇智科技网上教学服务，则本协议即对您产生约束，届时您不应以未阅读本协议的内容或者未获得汇智科技对您问询的解答等理由，主张本协议无效，或要求撤销本协议。",
                             pos=(120,210),
                             size=(300,100),
                             #创建丰富文本控件
                             style=wx.TE_MULTILINE|wx.TE_RICH2)
        #设置richText控件的文本样式
        richText.SetStyle(2,6,wx.TextAttr("white","black"))
        points=richText.GetFont().GetPointSize()
        #创建一个字体样式
        f=wx.Font(points+3,wx.ROMAN,wx.ITALIC,wx.BOLD,True)
        #用创建的字体样式设置文本样式
        richText.SetStyle(8,14,wx.TextAttr("blue",wx.NullColor,f))
    def OnLostFocus (self,event):
        wx.MessageBox('username:%s,password:%s'%(self.inputText.GetValue(),self.pwdText.GetValue()),'admin')      
def main():
    app=wx.PySimpleApp()
    frame=MultiTextFrame()
    frame.Show(True)
    app.MainLoop()

if __name__=="__main__":
    main()

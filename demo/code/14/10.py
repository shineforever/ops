import wx
class TextCtrlFrame(wx.Frame):
    def __init__ (self,parent,id,title):
        wx.Frame.__init__(self,parent,id,title,size=(350,200))
        panel=wx.Panel(self)
        labName=wx.StaticText(panel,-1,'用户名',pos=(50,10))
        self.inputText=wx.TextCtrl(panel,-1,'',pos=(120,10),size=(150,-1),style=wx.TE_LEFT|wx.TE_PROCESS_TAB)
        self.inputText.SetInsertionPoint(0)
        
        labPwd=wx.StaticText(panel,-1,'密码',pos=(50,50))
        self.pwdText=wx.TextCtrl(panel,-1,'',pos=(120,50),size=(150,-1),style=wx.TE_PASSWORD|wx.TE_PROCESS_ENTER)
        self.Bind(wx.EVT_TEXT_ENTER,self.OnLostFocus,self.pwdText)

    def OnLostFocus (self,event):
        wx.MessageBox('username:%s,password:%s'%(self.inputText.GetValue(),self.pwdText.GetValue()),'admin')
        
if __name__=='__main__':
    app=wx.PySimpleApp()
    frame=TextCtrlFrame(parent=None,id=-1,title='输入文本框')
    frame.Show()
    app.MainLoop()

        
    
        
    

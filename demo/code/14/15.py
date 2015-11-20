import wx
class RadioBoxFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self, None, -1,'单选按钮的分组',size=(400,200))
        panel=wx.Panel(self,-1)
        langList=['Java','ASP.NET','Python','Ruby','Flex','MVC']
        wx.RadioBox(panel,-1,'你最喜欢的一种语言？',(10,10),(300,100),langList,3,wx.RA_SPECIFY_COLS)
if __name__=='__main__':
    app=wx.PySimpleApp()
    radioBoxFrame=RadioBoxFrame()
    radioBoxFrame.Show()
    app.MainLoop()



        
    

import wx
class StaticTextFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'Static Text Example',size=(300,200))
        panel=wx.Panel(self,-1)
        text=wx.StaticText(panel,-1,'¾²Ì¬ÎÄ±¾¿ò',(70,50),(200,90),wx.ALIGN_CENTER)
        font=wx.Font(14,wx.DEFAULT,wx.ITALIC,wx.NORMAL,True)
        text.SetFont(font)
        text.SetForegroundColour('red')
        text.SetBackgroundColour('yellow')
if __name__=='__main__':
    app=wx.PySimpleApp()
    frame=StaticTextFrame()
    frame.Show()
    app.MainLoop()

        
    
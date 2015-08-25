import wx
class App(wx.App):
    def OnInit(self):
       dlg=wx.TextEntryDialog(None,"那么你最喜欢的一种编程语言是什么？","一个问题","Python")
       if dlg.ShowModal()==wx.ID_OK:
           print dlg.GetValue()
       return True
if __name__ == '__main__':
    app = App(False)   
    app.MainLoop()




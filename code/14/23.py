import wx
class Border(wx.Frame):
    def __init__(self, parent, id, title):
        wx.Frame.__init__(self, parent, id, title, size=(400, 400))
        panel = wx.Panel(self, -1)
        panel.SetBackgroundColour('white')
        vbox = wx.BoxSizer(wx.VERTICAL)
        langList=['Java','ASP.NET','Python','Ruby','Flex','MVC']
        for lang in langList :
            btn=wx.Button(panel,id,lang)
            vbox.Add(btn,0,wx.EXPAND | wx.ALL,10)
        panel.SetSizer(vbox)
        self.Centre()
        self.Show(True)

app = wx.App()
Border(None, -1,'')
app.MainLoop()


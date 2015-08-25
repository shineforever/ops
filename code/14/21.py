import wx
class FlexGridSizer(wx.Frame):
    def __init__(self, parent, id, title):
        wx.Frame.__init__(self, parent, id, title, size=(300, 200))
        panel = wx.Panel(self, -1)
        fgs = wx.FlexGridSizer(3, 2, 9, 25)
        title = wx.StaticText(panel, -1, '标题')
        tc1 = wx.TextCtrl(panel, -1)
        fgs.Add(title,0,0)
        fgs.Add(tc1,0,0)
        author = wx.StaticText(panel, -1, '作者')
        tc2 = wx.TextCtrl(panel, -1)
        fgs.Add(author,0,0)
        fgs.Add(tc2,0,0)
        review = wx.StaticText(panel, -1, '内容',size=(-1,100))
        tc3 = wx.TextCtrl(panel, -1,size=(-1,100) ,style=wx.TE_MULTILINE)
        fgs.Add(review,0,0)
        fgs.Add(tc3,0,0)
        panel.SetSizer(fgs)
        self.Centre()
        self.Show(True)

app = wx.App()
FlexGridSizer(None, -1, 'FlexGridSizer')
app.MainLoop()


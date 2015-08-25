import wx
class GridSizer(wx.Frame):
    def __init__(self, parent, id, title):
        wx.Frame.__init__(self, parent, id, title, size=(300, 200))
        panel=wx.Panel(self,-1)
        gs = wx.GridSizer(4, 4, 15,15)
        numList=['Cls','Bck','','Close','7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+']
        for num in numList :
            btn=wx.Button(panel,id,num)
            gs.Add(btn,0,0)
        panel.SetSizer(gs)
        self.Centre()
        self.Show(True)
app = wx.App()
GridSizer(None, -1, 'GridSizer')
app.MainLoop()


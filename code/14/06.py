import wx
import os
class App(wx.App):
    def OnInit(self):
        fileFilter="Python source(*.py)|*.py|All files(*.*)|*.*"
        dlg=wx.FileDialog(None , "Ñ¡ÔñÎÄ¼þ",os.getcwd(),"",fileFilter,wx.OPEN)
        dlg.ShowModal()
        dlg.Destroy()
        return True
if __name__ == '__main__':
    app=App()
    app.MainLoop()


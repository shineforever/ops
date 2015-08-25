import wx
class MyFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'多级菜单',size=(300,100))
        panel=wx.Panel(self)
        menu=wx.Menu()
        sMenu=wx.Menu()
        sMenu.Append(-1,'菜单一')
        sMenu.Append(-1,'菜单二')
        menu.AppendMenu(-1,'子菜单',sMenu)
        menuBar=wx.MenuBar()
        menuBar.Append(menu,'菜单')
        self.SetMenuBar(menuBar)
if __name__=='__main__':
    app=wx.PySimpleApp()
    frame=MyFrame()
    frame.Show()
    app.MainLoop()

        
    
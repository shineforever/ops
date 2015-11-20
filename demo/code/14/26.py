import wx 
class MyFrame(wx.Frame): 
    def __init__(self): 
        wx.Frame.__init__(self,None,-1,"Fancier Menu Example",size=(400,200)) 
        p = wx.Panel(self) 
        menu = wx.Menu() 
        bmp = wx.Bitmap("ico/file.png", wx.BITMAP_TYPE_PNG) 
        fileOpen = wx.MenuItem(menu, -1, "Open")
        fileOpen.SetBitmap(bmp)#增加一个自定义的位图 
        menu.AppendItem(fileOpen) 
        font = wx.SystemSettings.GetFont(wx.SYS_DEFAULT_GUI_FONT) 
        font.SetWeight(wx.BOLD) 
        item = wx.MenuItem(menu, -1, "Has Bold Font") 
        item.SetFont(font)#改变字体 
        menu.AppendItem(item) 
        exitFrame = menu.Append(-1, "Exit") 
        self.Bind(wx.EVT_MENU, self.OnExit, exitFrame)                   
        menuBar = wx.MenuBar() 
        menuBar.Append(menu, "Menu") 
        self.SetMenuBar(menuBar) 
    def OnExit(self, event): 
        self.Close()
if __name__ == "__main__": 
    app = wx.PySimpleApp() 
    frame = MyFrame() 
    frame.Show() 
    app.MainLoop() 


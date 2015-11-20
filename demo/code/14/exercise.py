import wx 

class MyFrame(wx.Frame): 
    def __init__(self): 
        wx.Frame.__init__(self, None, -1,"添加菜单",size=(500,300)) 
        p = wx.Panel(self) 
        self.txt = wx.TextCtrl(p, -1, "新菜单项") 
        btn = wx.Button(p, -1, "添加新菜单项") 
        self.Bind(wx.EVT_BUTTON, self.OnAddItem, btn) 

        sizer = wx.BoxSizer(wx.HORIZONTAL) 
        sizer.Add(self.txt, 0, wx.ALL, 20) 
        sizer.Add(btn, 0, wx.TOP|wx.RIGHT, 20) 
        p.SetSizer(sizer) 
        
        self.menu = menu = wx.Menu() 
        simple = menu.Append(-1, "新建") 
        menu.AppendSeparator() 
        exit = menu.Append(-1, "退出") 
        self.Bind(wx.EVT_MENU, self.OnSimple, simple) 
        self.Bind(wx.EVT_MENU, self.OnExit, exit) 
                  
        menuBar = wx.MenuBar() 
        menuBar.Append(menu, "文件") 
        self.SetMenuBar(menuBar) 

    def OnSimple(self, event): 
        wx.MessageBox("你选择了【新建】菜单项") 

    def OnExit(self, event): 
        self.Close() 

    def OnAddItem(self, event): 
        item = self.menu.Append(-1, self.txt.GetValue()) 
        self.Bind(wx.EVT_MENU, self.OnNewItemSelected, item) 

    def OnNewItemSelected(self, event): 
        item = self.GetMenuBar().FindItemById(event.GetId()) #得到菜单项   
        text = item.GetText() 
        wx.MessageBox("You Selected is the [ '%s' ] Item" % text)       
if __name__ == "__main__": 
    app = wx.PySimpleApp() 
    frame = MyFrame() 
    frame.Show() 
    app.MainLoop() 


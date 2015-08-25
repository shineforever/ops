import wx 
ID_ABOUT = 101 
ID_EXIT  = 102   
class MyFrame(wx.Frame): 
    def __init__(self, parent, ID, title): 
        wx.Frame.__init__(self, parent, ID, title, wx.DefaultPosition, wx.Size(400, 150)) 
        self.CreateStatusBar() 
        self.SetStatusText("汇智科技有限公司所有权") 
        menuBar = wx.MenuBar()             #创建菜单栏
        menu = wx.Menu()                    #创建菜单
        menuBar.Append(menu, "File");      #将File父菜单添加到菜单栏中
        menu.Append(ID_ABOUT, "About", "More information about this program")      #向菜单中添加子菜单
        menu.AppendSeparator()             #添加分割线
        menu.Append(ID_EXIT, "E&xit", "Terminate the program")       #向菜单中添加子菜单
        self.SetMenuBar(menuBar)          #将父菜单添加到窗口中
        #绑定事件
        wx.EVT_MENU(self, ID_ABOUT, self.OnAbout) 
        wx.EVT_MENU(self, ID_EXIT,  self.TimeToQuit) 
    #当单击About菜单时，弹出提示对话框
    def OnAbout(self, event): 
        dlg = wx.MessageDialog(self, "This sample program shows off\n" 
                              "frames, menus, statusbars, and this\n" 
                              "message dialog.", 
                              "About Me", wx.OK | wx.ICON_INFORMATION) 
        dlg.ShowModal()          #以模式窗口打开
        dlg.Destroy() 
    #单击Exit菜单时，关闭程序
    def TimeToQuit(self, event):     
        self.Close(True) 

class MyApp(wx.App): 
    def OnInit(self): 
        frame = MyFrame(None, -1, "Hello from wxPython") 
        frame.Show(True) 
        self.SetTopWindow(frame) 
        return True 
app = MyApp(0) 
app.MainLoop() 


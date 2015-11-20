import wx  
import os
class MainFrame ( wx.Frame ):          
    def __init__( self, parent ):  
        wx.Frame.__init__(self,parent,-1,'EditPlus',size=(500,300))
        panel=wx.Panel(self)
        menuBar=wx.MenuBar()
        fileMenu=wx.Menu()
        sFileMenu=wx.Menu()
        sFileMenu.Append(11,'标准文本')
        sFileMenu.Append(12,'HTML网页')
        fileMenu.AppendMenu(-1,'新建(N)',sFileMenu)#向菜单中添加菜单项
        fileMenu.Append(2,'&o 打开(O)')
        wx.EVT_MENU(self, 2, self.OnOpen) 
        fileMenu.Append(3,'关闭(C)')        
        menuBar.Append(fileMenu, "文件");
        fileMenu.AppendSeparator()
        editMenu=wx.Menu()
        editMenu.Append(4,'&Ctrl+Z 撤销')
        editMenu.Append(5,'&Ctrl+Y 重做')
        editMenu.Append(6,'剪切')
        editMenu.Append(7,'重做')
        menuBar.Append(editMenu,'编辑')
        editMenu.AppendSeparator()
        viewMenu=wx.Menu()
        menuBar.Append(viewMenu,'视图')
        self.exitMenu=wx.Menu()
        self.exitMenu.Append(1000,'退出')
        menuBar.Append(self.exitMenu,'系统菜单')
        sysMenu=wx.Menu()
        subSetMenu=sysMenu.Append(1001,'打开/屏蔽菜单')
        self.Bind(wx.EVT_MENU,self.OnExit,id=1000)
        self.Bind(wx.EVT_MENU_HIGHLIGHT,self.OnItemSelected,id=1000)
        self.Bind(wx.EVT_MENU,self.OnEnable,subSetMenu)
        menuBar.Append(sysMenu,'设置')
        self.SetMenuBar(menuBar)          #将父菜单添加到窗口中
        self.Show()
    def OnOpen (self,event):
        filterFile='Python Source(*.py)|*.py|All files(*.*)|*.*'
        dialog=wx.FileDialog(None,'选择文件',os.getcwd(),'',filterFile,wx.OPEN)
        dialog.ShowModal()
        dialog.Destroy()
    def OnEnable (self,event):
        menuBar=self.GetMenuBar()
        enabled=menuBar.IsEnabled(1000)
        self.exitMenu.Enable(1000,not enabled)
    def OnExit (self,event):
        self.Close()
    def OnItemSelected (self,event):
        item=self.GetMenuBar().FindItemById(event.GetId())
        wx.MessageBox('Menu:'+item.GetText())
app=wx.PySimpleApp()
MainFrame(None).Show()
app.MainLoop()

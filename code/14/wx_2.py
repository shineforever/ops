import wx
class ToolbarFrame(wx.Frame):
    def __init__(self, parent, id):
        wx.Frame.__init__(self, parent, id, '后台管理系统',
                size=(500, 300))
        panel = wx.Panel(self)
        panel.SetBackgroundColour('White')
        toolbar = self.CreateToolBar()     #创建工具栏
        toolbar.AddSimpleTool(wx.NewId(),wx.Image( 'ico/xin.png', wx.BITMAP_TYPE_PNG ).ConvertToBitmap(),
                "New")#给工具栏增加一个工具
        toolbar.AddSimpleTool(wx.NewId(),wx.Image( 'ico/save.png', wx.BITMAP_TYPE_PNG ).ConvertToBitmap(),
                "Save")#给工具栏增加一个工具
        toolbar.AddSimpleTool(wx.ID_DELETE,wx.Image( 'ico/abc.png', wx.BITMAP_TYPE_PNG ).ConvertToBitmap(),
                "Delete")#给工具栏增加一个工具
        toolbar.AddSimpleTool(wx.ID_EXIT, wx.Image( 'ico/exit.png', wx.BITMAP_TYPE_PNG ).ConvertToBitmap(),
                "Exit")
        toolbar.SetToolBitmapSize(wx.Size (10, 10)) 
        toolbar.Realize() # 准备显示工具栏

        statusbar = self.CreateStatusBar()     # 创建状态栏
        statusbar.SetStatusText("版权所有：河南省郑州市汇智科技有限公司 技术支持：汇智科技全体员工") # 给状态栏添加显示信息
        
        self.Bind(wx.EVT_TOOL, self.OnExit, id=wx.ID_EXIT)
        self.Bind(wx.EVT_TOOL,self.OnDelete,id=wx.ID_DELETE)
    def OnExit(self,event):
        dlg = wx.MessageDialog(None, '确定要退出程序吗？',   
                          '程序退出提示', wx.YES_NO | wx.ICON_QUESTION)   
        result = dlg.ShowModal()   
        # 如果单击的是确定按钮   
        if result == wx.ID_YES:   
            self.Close(True) 
        dlg.Destroy()
    def OnDelete(self,event):
        dlg = wx.MessageDialog(None, '确定要删除该条数据吗？',   
                          '删除数据提示', wx.YES_NO | wx.ICON_QUESTION)   
        result = dlg.ShowModal()   
        # 如果单击的是确定按钮   
        if result == wx.ID_YES:
            mydialog=MyDialog(parent=None,id=-1,title='删除')
        dlg.Destroy()
    
class MyDialog(wx.Dialog):
    def __init__(self,parent,id,title):
        wx.Dialog.__init__(self,parent,id,title,size=(200,200))
        self.panel=wx.Panel(self)
        self.OkBtn=wx.Button(self,10,'确定',pos=(50,100),size=(80,30))
        self.Bind(wx.EVT_BUTTON,self.CloseDlg,self.OkBtn)
        self.Show()
    def CloseDlg(self,event):
        self.Close()

        
if __name__ == '__main__':
    app = wx.PySimpleApp()
    frame = ToolbarFrame(parent=None, id=-1)
    frame.Show()
    app.MainLoop()

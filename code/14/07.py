import wx
import wx.py.images as images
class ToolbarFrame(wx.Frame):
    def __init__(self, parent, id):
        wx.Frame.__init__(self, parent, id, '工具栏',
                size=(500, 200))
        panel = wx.Panel(self)
        panel.SetBackgroundColour('White')
        toolbar = self.CreateToolBar()     #2 创建工具栏
        toolbar.AddSimpleTool(wx.NewId(), images.getPyBitmap(),
                "New", "Long help for 'New'") #3 给工具栏增加一个工具
        toolbar.Realize() # 准备显示工具栏
if __name__ == '__main__':
    app = wx.PySimpleApp()
    frame = ToolbarFrame(parent=None, id=-1)
    frame.Show()
    app.MainLoop()

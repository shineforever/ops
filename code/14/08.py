import wx
class StatusbarFrame(wx.Frame):
    def __init__(self, parent, id):
        wx.Frame.__init__(self, parent, id, '状态栏',
                size=(500, 200))
        panel = wx.Panel(self)
        panel.SetBackgroundColour('White')
        statusbar = self.CreateStatusBar()     # 创建状态栏
        statusbar.SetStatusText("状态栏信息") # 给状态栏添加显示信息
if __name__ == '__main__':
    app = wx.PySimpleApp()
    frame = StatusbarFrame(parent=None, id=-1)
    frame.Show()
    app.MainLoop()

import wx
class BitmapButtonFrame(wx.Frame):
    def __init__(self):
        wx.Frame.__init__(self, None, -1, 'Î»Í¼°´Å¥', 
                size=(400, 200))
        panel = wx.Panel(self, -1)
        jpg = wx.Image("ico/02.jpg", wx.BITMAP_TYPE_JPEG).ConvertToBitmap()
        self.button = wx.BitmapButton(panel, -1, jpg, pos=(90, 20),size=(200,95))
        self.Bind(wx.EVT_BUTTON, self.OnClick, self.button)
        self.button.SetDefault()
    def OnClick(self, event):
        self.Destroy()       
if __name__ == '__main__':
    app = wx.PySimpleApp()
    frame = BitmapButtonFrame()
    frame.Show()
    app.MainLoop()

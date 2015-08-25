import wx
class OpenResource(wx.Frame):
    def __init__(self, parent, id, title):
        wx.Frame.__init__(self, parent, id, title, size=(400, 400))
        panel = wx.Panel(self, -1)
        sizer = wx.GridBagSizer(4, 4)              #创建Grid Bag布局管理器
        text1 = wx.StaticText(panel, -1, 'Select a resource to open')   #创建静态文本框
        sizer.Add(text1, (0, 0), flag=wx.TOP | wx.LEFT | wx.BOTTOM, border=5)   #将静态文本框添加到布局管理器中
        tc = wx.TextCtrl(panel, -1)                #创建一个输入文本框
        sizer.Add(tc, (1, 0), (1, 3), wx.EXPAND | wx.LEFT | wx.RIGHT, 5)   #将输入文本框添加到布局管理器中
        text2 = wx.StaticText(panel, -1, 'Matching resources')
        sizer.Add(text2, (2, 0), flag=wx.TOP | wx.LEFT | wx.BOTTOM, border=5)
        list1 = wx.ListBox(panel, -1, style=wx.LB_ALWAYS_SB)    #创建一个空的列表框
        sizer.Add(list1, (3, 0), (5, 3), wx.EXPAND | wx.LEFT | wx.RIGHT, 5)  #将空列表框添加到布局管理器中
        text3 = wx.StaticText(panel, -1, 'In Folders')
        sizer.Add(text3, (8, 0), flag=wx.TOP | wx.LEFT | wx.BOTTOM, border=5)
        list2 = wx.ListBox(panel, -1, style=wx.LB_ALWAYS_SB)
        sizer.Add(list2, (9, 0), (3, 3), wx.EXPAND | wx.LEFT | wx.RIGHT, 5)
        cb = wx.CheckBox(panel, -1, 'Show derived resources')       #创建一个多选框
        sizer.Add(cb, (12, 0), flag=wx.LEFT | wx.RIGHT, border=5)   #将多选框添加到布局管理器中
        buttonOk = wx.Button(panel, -1, 'OK', size=(90, 28))        #创建一个按钮
        buttonCancel = wx.Button(panel, -1, 'Cancel', size=(90, 28))
        sizer.Add(buttonOk, (14, 1))                                #将上面创建的两个按钮控件添加到布局管理器中
        sizer.Add(buttonCancel, (14, 2), flag=wx.RIGHT | wx.BOTTOM, border=5)
        #创建一个位图按钮
        help = wx.BitmapButton(panel, -1, wx.Bitmap('ico/15b53eda7255d444d1164e2e.png'), style=wx.NO_BORDER) 
        sizer.Add(help, (14, 0), flag=wx.LEFT, border=5)       #将位图按钮控件添加到布局管理器中
        panel.SetSizer(sizer)            #将布局管理器添加到panel中
        self.Centre()
        self.Show(True)
app = wx.App()
OpenResource(None, -1, 'Open Resource')
app.MainLoop()



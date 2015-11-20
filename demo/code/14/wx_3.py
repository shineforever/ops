import wx
class FindReplace(wx.Frame):
    def __init__(self, parent, id, title):
        wx.Frame.__init__(self, parent, id,title, size=(255, 365))
        vbox_top = wx.BoxSizer(wx.HORIZONTAL)
        panel = wx.Panel(self, -1)
        vbox = wx.BoxSizer(wx.VERTICAL)
        # panel1
        panel1 = wx.Panel(panel, -1)
        grid1 = wx.GridSizer(2, 2)
        grid1.Add(wx.StaticText(panel1, -1, 'Find: ', (5, 5)), 0,  wx.ALIGN_CENTER_VERTICAL)
        grid1.Add(wx.ComboBox(panel1, -1, size=(120, -1)))
        grid1.Add(wx.StaticText(panel1, -1, 'Replace with: ', (5, 5)), 0, wx.ALIGN_CENTER_VERTICAL)
        grid1.Add(wx.ComboBox(panel1, -1, size=(120, -1)))

        panel1.SetSizer(grid1)
        vbox.Add(panel1, 0, wx.BOTTOM | wx.TOP, 9)

        # panel2

        panel2 = wx.Panel(panel, -1)
        hbox2 = wx.BoxSizer(wx.HORIZONTAL)

        sizer21 = wx.StaticBoxSizer(wx.StaticBox(panel2, -1, 'Direction'), orient=wx.VERTICAL)
        sizer21.Add(wx.RadioButton(panel2, -1, 'Forward', style=wx.RB_GROUP))
        sizer21.Add(wx.RadioButton(panel2, -1, 'Backward'))
        hbox2.Add(sizer21, 1, wx.RIGHT, 5)

        sizer22 = wx.StaticBoxSizer(wx.StaticBox(panel2, -1, 'Scope'), orient=wx.VERTICAL)
        # we must define wx.RB_GROUP style, otherwise all 4 RadioButtons would be mutually exclusive
        sizer22.Add(wx.RadioButton(panel2, -1, 'All', style=wx.RB_GROUP))
        sizer22.Add(wx.RadioButton(panel2, -1, 'Selected Lines'))
        hbox2.Add(sizer22, 1)

        panel2.SetSizer(hbox2)
        vbox.Add(panel2, 0, wx.BOTTOM, 9)

        # panel3

        panel3 = wx.Panel(panel, -1)
        sizer3 = wx.StaticBoxSizer(wx.StaticBox(panel3, -1, 'Options'), orient=wx.VERTICAL)
        vbox3 = wx.BoxSizer(wx.VERTICAL)
        grid = wx.GridSizer(3, 2, 0, 5)
        grid.Add(wx.CheckBox(panel3, -1, 'Case Sensitive'))
        grid.Add(wx.CheckBox(panel3, -1, 'Wrap Search'))
        grid.Add(wx.CheckBox(panel3, -1, 'Whole Word'))
        grid.Add(wx.CheckBox(panel3, -1, 'Incremental'))
        vbox3.Add(grid)
        vbox3.Add(wx.CheckBox(panel3, -1, 'Regular expressions'))
        sizer3.Add(vbox3, 0, wx.TOP, 4)

        panel3.SetSizer(sizer3)
        vbox.Add(panel3, 0, wx.BOTTOM, 15)

        # panel4

        panel4 = wx.Panel(panel, -1)
        sizer4 = wx.GridSizer(2, 2, 2, 2)
        sizer4.Add(wx.Button(panel4, -1, 'Find', size=(120, -1)))
        sizer4.Add(wx.Button(panel4, -1, 'Replace/Find', size=(120, -1)))
        sizer4.Add(wx.Button(panel4, -1, 'Replace', size=(120, -1)))
        sizer4.Add(wx.Button(panel4, -1, 'Replace All', size=(120, -1)))

        panel4.SetSizer(sizer4)
        vbox.Add(panel4, 0, wx.BOTTOM, 9)

        # panel5

        panel5 = wx.Panel(panel, -1)
        sizer5 = wx.BoxSizer(wx.HORIZONTAL)
        sizer5.Add((191, -1), 1, wx.EXPAND | wx.ALIGN_RIGHT)
        sizer5.Add(wx.Button(panel5, -1, 'Close', size=(50, -1)))

        panel5.SetSizer(sizer5)
        vbox.Add(panel5, 1, wx.BOTTOM, 9)

        vbox_top.Add(vbox, 1, wx.LEFT, 5)
        panel.SetSizer(vbox_top)

        self.Centre()
        self.Show()

app = wx.App()
FindReplace(None, -1, 'Find/Replace')
app.MainLoop()


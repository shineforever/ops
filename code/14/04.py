import wx
class App(wx.App):   
    def OnInit(self):   
        dlg = wx.MessageDialog(None, '你单击了【退出系统】按钮，你确定要退出程序吗？如果确定单击【是】，否则单击【否】。',   
                          '程序退出提示', wx.YES_NO | wx.ICON_QUESTION)   
        result = dlg.ShowModal()    
        if result == wx.ID_YES:   
            print '你单击了确定按钮'  
        dlg.Destroy()   
        return True    
if __name__ == '__main__':   
    app = App(False)   
    app.MainLoop()

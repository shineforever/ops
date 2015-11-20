import wx
class ChoiceFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None ,-1,'可编辑的下拉列表框',size=(300,200))
        panel=wx.Panel(self,-1)
        langList=['Java','ASP.NET','Python','Ruby','Flex','MVC']
        wx.ComboBox(panel,-1,'Python',(50,10),(200,150),langList,wx.CB_DROPDOWN)
if __name__=='__main__':
    app=wx.PySimpleApp()
    choiceFrame=ChoiceFrame()
    choiceFrame.Show()
    app.MainLoop()

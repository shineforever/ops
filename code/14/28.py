import wx
class ListBoxFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'ап╠М©Р',size=(200,200))
        panel=wx.Panel(self,-1)
        langList=['Python','Java','ASP.NET']
        self.checkListBox=wx.CheckListBox(panel,-1,(10,10),(80,100),langList,wx.LB_SORT)
if __name__=='__main__':
    app=wx.PySimpleApp()
    ListBoxFrame().Show()
    app.MainLoop()

        
    

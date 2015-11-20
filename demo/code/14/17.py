import wx
class ListBoxFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'列表框',pos=(10,10),size=(300,180))
        panel=wx.Panel(self,-1)
        langList=['Java','ASP.NET','Python','Ruby','Flex','MVC']
        self.listBox=wx.ListBox(panel,-1,(10,10),(150,120),langList,wx.LB_SINGLE)
        self.listBox.SetSelection(0)
        self.Bind(wx.EVT_LISTBOX,self.OnSelected,self.listBox)
    def OnSelected (self,event):
        index=self.listBox.GetSelection()
        wx.MessageBox(self.listBox.GetString(index),'提示')
if __name__=='__main__':
    app=wx.PySimpleApp()
    ListBoxFrame().Show()
    app.MainLoop()

        
        
    

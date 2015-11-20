import wx
class ContextMenuFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'上下文菜单',size=(400,200))
        self.panel=wx.Panel(self)
        self.staticText=wx.StaticText(self.panel,-1,'语言查询：',pos=(10,30))
        self.inputCtrl=wx.TextCtrl(self.panel,-1,pos=(80,30),size=(200,-1))
        self.popupmenu=wx.Menu()
        langList=['Python','Java','ASP.NET','ExtJS']
        for menu in langList :
            lang=self.popupmenu.Append(-1,menu)
            self.Bind(wx.EVT_MENU,self.OnMenuItemSelected,lang)
            self.inputCtrl.Bind(wx.EVT_CONTEXT_MENU,self.OnPopup)

    def OnMenuItemSelected (self,event):
        item=self.popupmenu.FindItemById(event.GetId())
        self.inputCtrl.SetLabel(item.GetText())
       

    def  OnPopup(self,event):
        pos=self.panel.ScreenToClient(event.GetPosition())
        self.panel.PopupMenu(self.popupmenu,pos)
if __name__=='__main__':
    app=wx.PySimpleApp()
    frame=ContextMenuFrame()
    frame.Show()
    app.MainLoop()


        
           
            
        
    

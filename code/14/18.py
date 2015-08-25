import wx
class ChoiceFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None ,-1,'下拉列表框',size=(300,200))
        panel=wx.Panel(self,-1)
        langList=['Java','ASP.NET','Python','Ruby','Flex','MVC']
        wx.Choice(panel,-1,pos=(50,10),size=(150,100),choices=langList)
if __name__=='__main__':
    app=wx.PySimpleApp()
    choiceFrame=ChoiceFrame()
    choiceFrame.Show()
    app.MainLoop()



        
    

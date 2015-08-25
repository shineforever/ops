import wx
class CheckBoxFrame(wx.Frame):
    def __init__ (self):
        wx.Frame.__init__(self,None,-1,'多选框',size=(400,200))
        panel=wx.Panel(self,-1)
        wx.StaticText(panel,-1,'你最喜欢的电影演员是：',pos=(10,10),size=(150,20))
        wx.CheckBox(panel,-1,'陆毅',pos=(10,30),size=(100,20))
        wx.CheckBox(panel,-1,'董洁',pos=(10,50),size=(100,20))
        wx.CheckBox(panel,-1,'姜文',pos=(10,70),size=(100,20))
        wx.CheckBox(panel,-1,'刘亦菲',pos=(10,90),size=(100,20))
        wx.CheckBox(panel,-1,'赵薇',pos=(10,110),size=(100,20))
if __name__=='__main__':
    app=wx.PySimpleApp()
    checkBox=CheckBoxFrame()
    checkBox.Show()
    app.MainLoop()


        
    

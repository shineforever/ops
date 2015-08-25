mystr=raw_input('请输入你想要知道的对象')
class MyWorld:
	#定义的人对象
	def person (self):
		self.mytalk='我可以用语言来表达'
		self.mylimbs='也可以用肢体语言来表达'
		self.myeyes='你可以眉目传情吗'
		print '我是人，因此我可以%s,%s,%s'%(self.mytalk,self.mylimbs,self.myeyes)
	#定义的猪对象
	def pig (self):
		self.mytalk='哼哼哼哼'
		self.myspecialty='吃饭，睡觉'
		self.mymaster='谁对我好，谁就是我的主人' 
		print '我是猪，我的特点就是%s,%s,%s'%(self.mytalk,self.myspecialty,self.mymaster)
	#定义的公鸡对象
	def rooster (self):
		self.mywork='在天朦朦亮的时候打鸣'
		self.mymotto='所谓闻鸡起舞，说的就是我'
		print '我是公鸡，我可以%s,%s'%(self.mywork,self.mymotto)		
		
if __name__=='__main__':
	myworld=MyWorld()
	if mystr=='人':
		myworld.person()
	elif mystr=='猪':
		myworld.pig()
	elif mystr=='公鸡':
		myworld.rooster()
	else:
		print '不好意思，该类中没有录入该对象'

		

	

	
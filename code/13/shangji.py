from xml.dom.minidom import *
root=parse('shangji.xml')

def traverSal (node):
	if not node.childNodes:
		return
	for child in node.childNodes:
		print child
		traverSal(child)
print '---------XML文档全部显示的效果-----------'
print traverSal(root)
print '-----------查询XML文档的效果------------'
names= root.getElementsByTagName("Name")
for name in names:
	print name.toxml()

print '-----------向XML文档中增加节点--------------'
goods=root.createElement('goods')
tests=root.createElement('tests')
text=root.createTextNode('food is my best')
tests.appendChild(text)
goods.appendChild(tests)
print goods.toxml()

print '---------从XML文档中删除节点-----------'
#goods.removeChild(tests)
#print goods.toxml()
print '----------替换XML文档中的节点------------'	
ceshi=root.createElement('ceshi')
text=root.createTextNode('wo shi ceshi')
ceshi.appendChild(text)
goods.replaceChild(ceshi,tests)
print goods.toxml()

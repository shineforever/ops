from xml.dom.minidom import Document
# 声明一个DOM结构
doc = Document()
# 创建一个根元素“美丽诗句”
wml = doc.createElement("美丽诗句")
doc.appendChild(wml)
# 在根元素“美丽诗句”下添加子元素“春天”
maincard = doc.createElement("春天")
maincard.setAttribute("id", "main")
wml.appendChild(maincard)
#在子元素“春天”下添加子节点“咏柳”
paragraph1 = doc.createElement("咏柳")
maincard.appendChild(paragraph1)
#在子节点“咏柳”下添加说明
ptext = doc.createTextNode("碧玉妆成一树高，万条垂下绿丝绦")
paragraph1.appendChild(ptext)
#在子元素"春天"下添加子节点“游园不值”
paragraph1 = doc.createElement("游园不值")
maincard.appendChild(paragraph1)
#在子节点“游园不值”下添加说明
ptext = doc.createTextNode("春色满园关不住，一枝红杏出墙来")
paragraph1.appendChild(ptext)
#在子元素“春天”下添加子节点“春日”
paragraph1 = doc.createElement("春日")
maincard.appendChild(paragraph1)
#在子节点“春日”下添加说明
ptext = doc.createTextNode("等闲识得东风面，万紫千红总是春")
paragraph1.appendChild(ptext)
# 打印输出XML文件中的内容
print doc.toprettyxml(indent=" ")

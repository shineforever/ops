#coding=utf-8
gequ=['�������ǰ�','ȫ��ͨ��','�뿪����','������','����߲���','ĪʧĪ��']
countStr=raw_input('循环次数')
count=int(countStr)
qizhong=raw_input('������Ŀǰ������ĸ���')
tiaoguo=raw_input('�����������ĸ���')
i=1
while i<=count:
	i+=1
	print '---------------次数--------------'
	for danqu in gequ:
		if danqu==qizhong:
			break
		if danqu==tiaoguo:
			continue
		print '序号',i-1,'单次',danqu

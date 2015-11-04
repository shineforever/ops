# coding=utf-8
a = int(raw_input("����������Ҫ��������֣�"))
if a > 0:
    print "�����������һ������"
else:
    print "�����������һ������"
    
b = input("������һ���ж���������һ�����֣�")
if b > 0:
    print "�����������һ������"
elif b < 0:
    print "�����������һ������"
else:
    print "�����������0"
s = raw_input("�𾴵��û���������������֣�");
if s.endswith("wang"):
    if s.startswith("yabin"):
        print "��ã�wangyabin"
    elif s.startswith("jing"):
        print "��ã�wangjing"
else:
    print "����������ȷ�����֣�лл"

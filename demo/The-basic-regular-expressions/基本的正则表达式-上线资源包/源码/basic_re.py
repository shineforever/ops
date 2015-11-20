#-*-coding:utf8-*-

#导入re库文件
import re
# from re import findall,search,S

secret_code = 'hadkfalifexxIxxfasdjifja134xxlovexx23345sdfxxyouxx8dfse'

#.的使用举例
# a = 'xy123'
# b = re.findall('x...',a)
# print b

#*的使用举例
# a = 'xyxy123'
# b = re.findall('x*',a)
# print b


#?的使用举例
# a = 'xy123'
# b = re.findall('x?',a)
# print b

'''上面的内容全部都是只需要了解即可，需要掌握的只有下面这一种组合方式(.*?)'''

# #.*的使用举例
# b = re.findall('xx.*xx',secret_code)
# print b
# # #.*？的使用举例
# c = re.findall('xx.*?xx',secret_code)
# print c
#
#
#
# #使用括号与不使用括号的差别
# d = re.findall('xx(.*?)xx',secret_code)
# print d
# for each in d:
#     print each

# s = '''sdfxxhello
# xxfsdfxxworldxxasdf'''
#
# d = re.findall('xx(.*?)xx',s,re.S)
# print d


#对比findall与search的区别
# s2 = 'asdfxxIxx123xxlovexxdfd'
# # f = re.search('xx(.*?)xx123xx(.*?)xx',s2).group(2)
# # print f
# f2 = re.findall('xx(.*?)xx123xx(.*?)xx',s2)
# print f2[0][1]

#sub的使用举例
# s = '123rrrrr123'
# output = re.sub('123(.*?)123','123%d123'%789,s)
# print output

#演示不同的导入方法
# info = findall('xx(.*?)xx',secret_code,S)
# for each in info:
#     print each

#不要使用compile
# pattern = 'xx(.*?)xx'
# new_pattern = re.compile(pattern,re.S)
# output = re.findall(new_pattern,secret_code)
# print output

#匹配数字
a = 'asdfasf1234567fasd555fas'
b = re.findall('(\d+)',a)
print b
import sqlite3				#导入sqlite3模块
conn=sqlite3.connect('userDB.db')	#连接数据库userDB，如果userDB不存在，则创建数据库userDB
cur=conn.cursor()
print '---------未处理之前的数据-----------'
conn.execute("create table if not exists address(id integer primary key autoincrement,name varchar(128),address varchar(128))")		#如果address表不存在，则创建表address
conn.execute("insert into address(name,address)values('dcy','zhengzhou')")	#添加一条数据到表address
cur.execute("select * from address")
res=cur.fetchall()				#调用游标对象cur的fetchall()方法返回表address中的所有数据
print "address:",res				#输出结果集

for line in res:					#输出结果集
	for f in line:
		print f	

conn.execute("delete from address where id=12")
conn.execute("delete from address where id=17")
conn.execute("delete from address where id=30")
conn.execute("delete from address where id=30")
strUpdate=raw_input('请选择您要修改某条数据的编号：')
strId=raw_input('请选择您要删除某条数据的编号：')

conn.execute("update address set name='maxianglin' where id="+strUpdate)

conn.execute("delete from address where id="+strId)
conn.commit()					#手动提交
print '-------------处理之后的数据----------------'
cur.execute("select * from address")	#调用游标对象cur的execute方法查询表address中的数据
res=cur.fetchall()				#调用游标对象cur的fetchall()方法返回表address中的所有数据
print "address:",res				#输出结果集

for line in res:					#输出结果集
	for f in line:
		print f	
cur.close()						#关闭游标对象cur
conn.close()						#关闭数据库链接对象conn

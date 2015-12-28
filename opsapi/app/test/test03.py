import MySQLdb
db = MySQLdb.connect(host="localhost",user="root",passwd="123",db="user",charset='utf8')
cur = db.cursor()
cur.execute('select * from user')

# for c in cur.fetchall():
#     print 'name is %s and %d years old' % c

print cur.fetchone()
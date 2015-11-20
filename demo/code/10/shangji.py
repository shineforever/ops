import pymssql
conn=pymssql.connect(host='.\SQLEXPRESS',user='sa',password='sa',database='UserDB')
cur=conn.cursor()
print '请选择您的下一步:\n(添加) 往数据库中添加内容\t(删除) 删除数据库中的内容\t(修改)修改数据的内容\n(查询) 查询数据的内容'
check=raw_input('选择您想要进行的操作:')
if check=='添加':
    print '------------欢迎您使用添加数据的功能-------------'
    username=raw_input('请输入您的用户名：')
    userpass=raw_input('请输入您的密码：')
    useraddress=raw_input('请输入您的地址：')
    userphone=raw_input('请输入您的联系电话：')
    sql="INSERT INTO tabUser(userName,userPass,userAddress,userPhone)VALUES(%s,%s,%s,%s)"
    param=(username,userpass,useraddress,userphone)
    n=cur.execute(sql,param)
    conn.commit()
    print '--------恭喜你，添加成功-------'
    print '----------添加之后的数据-----'
    cur.execute('select * from tabUser')
    result=cur.fetchall()
    for resultItem in result:
        print resultItem
        
if check=='删除':
    userid=raw_input('请输入您想要删除用户的编号：')
    cur.execute('delete from tabUser where id='+userid)
    conn.commit()
    print '------------恭喜你，删除成功------------'
    print '-----------删除之后所显示的数据--------------'
    cur.execute('select * from tabUser')
    result=cur.fetchall()
    for resultItem in result:
        print resultItem
        
if check=='查询':
    userid=raw_input('请输入您想要查询用户的编号：')
    cur.execute('select * from tabUser where id='+userid)
    print '------------恭喜你，查询的数据如下所示------------'
    result=cur.fetchone()
    print '您查询的数据编号为：'+str(result[0])
    print '您查询的数据名称为：'+str(result[1])
    print '您查询的数据密码为：'+str(result[2])
    print '您查询的数据地址为：'+str(result[3])
    print '您查询的数据电话为：'+str(result[4])
    
if check=='修改':    
    userid=raw_input('请输入您想要修改用户的编号：')
    username=raw_input('请输入您修改的用户名：')
    userpass=raw_input('请输入您修改的密码：')
    useraddress=raw_input('请输入您修改的地址：')
    userphone=raw_input('请输入您修改的联系电话：')
    sql='update tabUser set userName=%s,userPass=%s,userAddress=%s,userPhone=%s where id=%s'
    param=(username,userpass,useraddress,userphone,userid)
    cur.execute(sql,param)
    conn.commit()
    print '-----------更新之后的数据显示-------------'
    cur.execute('select * from tabUser')
    result=cur.fetchall()
    for resultItem in result:
        print resultItem
cur.close()
conn.close()
    
    
        
        
    

        
        
    

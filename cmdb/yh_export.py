#!/usr/bin/env python
#coding: utf-8

import cx_Oracle
import jpype
import os.path
import time
import paramiko
from jpype import *  
import logging
from ftplib import FTP
import os, sys
import smtplib
from smtplib import SMTP
from email.header import Header
from email.mime.text import MIMEText

import os
os.environ['NLS_LANG'] = 'SIMPLIFIED CHINESE_CHINA.UTF8'
os.chdir('/home/ops')
print os.getcwd()

def send_mail(msg):

    mailInfo = {
        "from": "jdb_tech@163.com",
     #   "to":  'hebin@jiedaibao.com',
        "hostname": "smtp.163.com",
        "username": "jdb_tech",
        "password": "zlydvd120",
        "mailsubject": "Alter mail: DataReporter Exception :" + msg,
        "mailtext": msg,
        "mailencoding": "utf-8"
    }

    smtp = SMTP(mailInfo["hostname"])
    smtp.set_debuglevel(1)
    smtp.ehlo(mailInfo["hostname"])
    smtp.login(mailInfo["username"],mailInfo["password"])
     
    msg = MIMEText(mailInfo["mailtext"],"text",mailInfo["mailencoding"])
    msg["Subject"] = Header(mailInfo["mailsubject"],mailInfo["mailencoding"])
    msg["from"] = mailInfo["from"]
    receiver = ['hebin@jiedaibao.com', 'zhanglb@jiedaibao.com']
    smtp.sendmail(mailInfo["from"], receiver , msg.as_string())
     
    smtp.quit()

    
def write_log(message):
    logger = logging.getLogger()
    filename = time.strftime('%Y-%m-%d',time.localtime(time.time()))
    handler = logging.FileHandler("./log/"+filename+".log")
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s') 
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    logger.setLevel(logging.NOTSET)
    logger.info(message)

def start_jvm():
    jvmpath = getDefaultJVMPath()
    startJVM(jvmpath, "-ea", "-Djava.class.path=.")

def shut_jvm():
    shutdownJVM()

def dcode(mw):
    hdes = JClass('HiDesUtils')
    s = hdes.desDeCode(mw)
    return s

def dbconn():
        dbconn = 'tempuser1/ymiU1iaGD4R2fWC8@100.115.3.1/dbm01dg2'
       # sql = 'select * from mbl_test'
        sql = """
        SELECT T.REG_MBL, 
        T.ID_NO,
        '' ISSUINGAUTHORITY,
        '' IDEXDATE,
        T.CUS_NM,
        F.CAP_CRD_NO,
        F.CAP_CORG_NM,
        F.CAP_CORG,
        F.BNK_PHONE,
        TO_DATE(F.TM_SMP, 'YYYY-MM-DD HH24:MI:SS')
        FROM PAYADM.URMTPINF T,
        PAYADM.PWMTCAD  F
        WHERE T.USR_NO = F.USR_NO
        AND F.CRD_EFF_FLG = '0'
        AND SUBSTR(F.TM_SMP, 0, 8) = TO_CHAR(SYSDATE - 1, 'YYYYMMDD')
        """
        try:
            conn=cx_Oracle.connect(dbconn)
            c=conn.cursor()
            x=c.execute(sql)

            rows = x.fetchall()
            c.close()
            conn.close()
        except Exception,e:
            write_log(str(e))
            message = '今日数据报表生成异常: 连接oracle数据库异常，详情请查看日志'
            send_mail(message)

        return rows

def write_txt(filename):
        
        f = open(filename,'w')
        start_jvm()
        for row in dbconn():
            mb = sum([int(row[0]),7654321])
            f.write(str(mb)+"\t")
           # f.write(str(row[0])+"\t")

            id_no = dcode(row[1])
            f.write(str(id_no).replace(str(id_no)[6:14],'19990101') + "\t")
            f.write(str(row[2])+"\t")
            f.write(str(row[3])+"\t")
            
            f.write(str(row[4])[:-3] + "烫"+"\t")
            card_no = dcode(row[5])
            
            f.write(str(card_no).replace(str(card_no)[-5:],'000000')+"\t")
            f.write(str(row[6])+"\t")
            f.write(str(row[7])+"\t")
            f.write(str(row[8])+"\t")
            f.write(str(row[9])+"\n")
        write_log("DataReporter has generated")
        shut_jvm()

def upload_txt(filename):
    hostname = '100.1xx.xxx'
    port = 22
    ftp_name = 'upload'
    password = 'xxxx'

    localpath = "/home/ops/" + filename
    remotepath = "/upload/" + filename

    try:
        t = paramiko.Transport((hostname,port))
        t.connect(username=ftp_name,password=password)
        sftp = paramiko.SFTPClient.from_transport(t)

        write_log('Beginning to upload file  from ' + hostname )            
        write_log('uploading file:' + remotepath)

        sftp.put(localpath,remotepath)

        write_log('upload file success')       
                      
        write_log('##########################################')

        t.close()
    except Exception, e:
        write_log(str(e))
        message = '今日数据报表生成异常: 推送增量日志失败，详情请查看日志'
        send_mail(message)

# def ftp_upload(filename):
#     ip = '100.66.153.102'
#     ftp = FTP(ip)
#     ftp.login('admin', '1234qwer')
#     ftp.retrlines('LIST') 
#     ftp.cwd('.')
#     ftp.retrlines('LIST')
#     localfile = filename
#     f = open(localfile, 'rb') 

#     write_log('Beginning to upload file  from ' + ip )
#     write_log('uploading file:' + filename)
#     ftp.storbinary('STOR %s' % os.path.basename(localfile), f) 
#     write_log('upload file success')                      
#     write_log('##########################################')

if __name__ == '__main__':

    ftime = time.strftime('%Y%m%d',time.localtime(time.time()))
    filename = 'TEST_CustBandCardJDB_' + ftime + '.TXT'
    write_txt(filename)
    upload_txt(filename)
    # ftp_upload(filename)
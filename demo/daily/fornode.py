#!/usr/bin/python
#-*- coding: utf-8 -*-
#****************************************************************#
# ScriptName: forssh.py
# Create Date: 2015-11-23 13:47
# Modify Date: 2015-11-23 13:47
#***************************************************************#
import paramiko
import threading
import commands
import getopt
import sys

class fornode:
    def ssh2(ip,username,passwd,cmd):
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip,22,username,passwd,timeout=3)
            for m in cmd:
                stdin,stdout,stderr = ssh.exec_command(m)
                out = stdout.readlines()
                for o in out:
                    print '%s:%s'%(ip,o)
            ssh.close()

        except:
            print '%s\tERROR\n'%(ip)

    def get_host_by_app(app):
        host = commands.getstatusoutput('getapp ' + app)[1].split("\n")[0].split(" ")
        return host


    if __name__=='__main__':
#    cmd = ['uptime']
        cmd = [sys.argv[2]]
        username = "www"
        passwd = ""
        threads = []
        app=sys.argv[1]

        print "Begin....."
        host = get_host_by_app(app)

    if len(host) > 1:
        host = get_host_by_app(app)
        for ip in host:
            a=threading.Thread(target=ssh2,args=(ip,username,passwd,cmd))
            a.start()
    else:
        ip = sys.argv[1]
        a=threading.Thread(target=ssh2,args=(ip,username,passwd,cmd))
        a.start()
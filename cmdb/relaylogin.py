#!/usr/bin/python
# -*- coding: utf-8 -*-
#****************************************************************#
# ScriptName: relayshell.py
# Create Date: 2014-08-19 14:17
# Modify Date: 2014-08-19 14:17
#***************************************************************#
import os, json, urllib, urllib2, getpass, re
import traceback
import time,pexpect
import termios
import struct
import fcntl
import signal
import httplib
import readline
import subprocess
import sys
import pdb
username = getpass.getuser()
#username = "guowu"
www_key="/home/relay_keys/www_id_rsa"
root_key="/home/relay_keys/root_id_rsa"
guest_key="/home/relay_keys/guest_id_rsa"
url = "http://10.2.101.41:8080/api/getUserAuth"

postDict = {"userName":username}
postData = urllib.urlencode(postDict)
log_dir="/home/pexpect_log"
def ipFormatChk(ipaddr):
    if ipaddr == "":
        return True
    pattern = r"^\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b$"
    if re.match(pattern, ipaddr):
        return True
    else:
        return False

def hostnameFormatChk(hostname):
    if hostname == "":
        return True
    pattern = r"^[0-9a-z\-]+.\.[0-9a-z\-]+$"
    if re.match(pattern, hostname):
        return True
    else:
        return False

def relay_help():
    print '''
    If u have any problem with relay, contact with taoshoukun@weidian.com
    1.list all host info
    2.help info
    0.exit
'''
def get_host_list():
    ret=[]
    try:
        req = urllib2.Request(url, postData)
        req.add_header('Content-Type', "application/x-www-form-urlencoded")
        resp = urllib2.urlopen(req)
        result = resp.read()
        ret = json.loads(result)
        if ret:
            return ret
        else:
            return False
    except:
        return False

def list_info():
    try:
        ret=get_host_list()
        if ret:all_host_list=ret
    except:
        pass
    print "%-8s\t%-30s\t%-15s ===> %-6s" % ("["+echo_ret("a[n]")+"]","APPNAME","IP","role")
    print "---"*30
    for  i in range(0,len(all_host_list)):
        host=all_host_list[i]
        tmp_num="["+echo_ret("a"+str(i))+"] "
        print "%-8s\t%-30s\t%-15s ===> %-6s" % (tmp_num,host.get('appName','NULL'),host['targetIp'],host['role'])

def ssh_connect(key):
    tag = 1
    try:
        ret=get_host_list()
    except:
            ret=all_host_list
    for host in ret:
        if host['targetIp'] == key:
            tag = 0
            try:
                pexpect_ssh(key,host['role'])
                break
            except Exception,e:
                traceback.print_exc()
                print "Error: "+str(e)
                print "pls try again"
    if tag == 1:
        try:
            pexpect_ssh(key)
        except Exception,e:
            traceback.print_exc()
            print "pls try again"

# by taoshoukun
def c_echo(content,color='green'):
    if color == 'green':
        print '\033[32m%s\033[0m' % content
    elif color == 'red':
        print '\033[31m%s\033[0m' % content
    elif color == 'blue':
        print '\033[31m%s\033[0m' % content
    elif color == 'yel':
        print '\033[33%s\033[0m' % content
    elif color == 'yel':
        print '\033[33%s\033[0m' % content

def echo_ret(content,color='green'):
    if color == 'green':
        return '\033[32m%s\033[0m' % content
    elif color == 'red':
        return '\033[31m%s\033[0m' % content
    elif color == 'blue':
        return '\033[31m%s\033[0m' % content
    elif color == 'yel':
        return '\033[33%s\033[0m' % content
    elif color == 'yel':
        return '\033[33%s\033[0m' % content

def getwinsize():
    """This function use to get the size of the windows!"""
    if 'TIOCGWINSZ' in dir(termios):
        TIOCGWINSZ=termios.TIOCGWINSZ
    else:
        TIOCGWINSZ = 1074295912L # Assume
    s = struct.pack('HHHH', 0, 0, 0, 0)
    x = fcntl.ioctl(sys.stdout.fileno(), TIOCGWINSZ, s)
    return struct.unpack('HHHH', x)[0:2]

def sigwinch_passthrough (sig,data):
    winsize = getwinsize()
    pssh.setwinsize(winsize[0],winsize[1])

def pexpect_ssh(login_host,login_user=username):
    global logfile
    print logfile
    logfile=open("%s/%s_%s_%s_log" % (log_dir,username,time.strftime('%Y%m%d'),login_host), 'ab+')
    logfile.write('\n\n%s\n\n' % time.strftime('%Y%m%d_%H%M%S'))
    times_num=0
    global pssh
    if login_user == 'op':
        ssh_key=www_key
        login_user="www"
    elif login_user == 'dev':
        ssh_key=guest_key
        login_user="guest"
    elif login_user == 'sa':
        ssh_key=root_key
        login_user="root"
    else:
        ssh_key="/dev/null"
    cmd='export SSH_SHTERM_NAME='+username+';ssh -o ConnectTimeout=3 -o SendEnv=SSH_SHTERM_NAME -i %s  %s@%s' % (ssh_key,login_user,login_host)
    pssh=pexpect.spawn('/bin/bash', ['-c', cmd])
    pssh.logfile = logfile
    c_echo("login For:"+login_host+" for:"+login_user)
    signal.signal(signal.SIGWINCH, sigwinch_passthrough)
    size = getwinsize()
    #pssh.setwinsize(size[0], size[1])
    pssh.interact()
    logfile.close()
    pssh.terminate(force=True)


def is_valid_targetIp(ip):
    try:
        return len([i for i in ip.split('.') if (0<= int(i)<= 255)]) == 4
    except:
        return False

    return True


class InputException(Exception):
    pass


content = ""
logfile=''
relay_help()
all_host_list=get_host_list()
try:
    while True:
        content = raw_input('\nPlease input your choice:')
        print "\n"
        tmp_list = content.split(" ")
#        content = content.replace(' ', '')
        if content == "1":
            list_info()
        elif content == "2":
            relay_help()
        elif content == "exit" or content == "0":
            break
        elif re.match("^a([0-9]*[0-9])$",content):
            m=re.match("^a([0-9]*[0-9])$",content)
            try:
                if int(m.group(1)) <= len(all_host_list):
                    ssh_connect(all_host_list[int(m.group(1))]['targetIp'])
                relay_help()
            except:
                traceback.print_exc()
                relay_help()
        elif ipFormatChk(tmp_list[0]) or hostnameFormatChk(tmp_list[0]):
            ssh_connect(content)
            relay_help()
        else:
            print "your input error"
    print "\nexit the session"
except Exception,e:
    print e
    traceback.print_exc()
    #print "\nexit the session"
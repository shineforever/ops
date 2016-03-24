#-*- coding: UTF-8 -*-
import sys,ldap
import ldap

LDAP_HOST = 'ldap://10.2.1.200:389'
USER = 'cn=zhanglongbao,dc=koudai,dc=com'
PASSWORD = 'asdasd'
BASE_DN = 'ou=People,dc=koudai,dc=com'
class LDAPTool: 
      
    def __init__(self,ldap_host=None,base_dn=None,user=None,password=None): 
        if not ldap_host: 
            ldap_host = LDAP_HOST 
        if not base_dn: 
            self.base_dn = BASE_DN 
        if not user: 
            user = USER 
        if not password: 
            password = PASSWORD 
        try: 
            self.ldapconn = ldap.initialize(LDAP_HOST)
            self.ldapconn.simple_bind(user,password)
        except ldap.LDAPError,e: 
            print e 

    def ldap_search_dn(self,uid=None):
        obj = self.ldapconn
        obj.protocal_version = ldap.VERSION3
        searchScope = ldap.SCOPE_SUBTREE
        retrieveAttributes = None
        searchFilter = "uid=" + uid

        try:
            ldap_result_id = obj.search(self.base_dn, searchScope, searchFilter, retrieveAttributes)
            result_type, result_data = obj.result(ldap_result_id, 0)
            print result_data
            if result_type == ldap.RES_SEARCH_ENTRY:
                #dn = result[0][0]
                return result_data[0][0]
            else:
                return None
        except ldap.LDAPError, e: 
            print e 

    def ldap_get_user(self,uid=None):
        obj = self.ldapconn 
        obj.protocal_version = ldap.VERSION3 
        searchScope = ldap.SCOPE_SUBTREE 
        retrieveAttributes = None
        searchFilter = "uid=" + uid
        try: 
            ldap_result_id = obj.search(self.base_dn, searchScope, searchFilter,retrieveAttributes)
            result_type, result_data = obj.result(ldap_result_id, 0) 
            if result_type == ldap.RES_SEARCH_ENTRY: 
                username = result_data[0][1]['cn'][0] 
                email = result_data[0][1]['mail'][0] 
                nick = result_data[0][1]['sn'][0] 
                result = {'username':username,'email':email,'nick':nick} 
                return result 
            else: 
                return None
        except ldap.LDAPError, e: 
            print e 

    def ldap_get_vaild(self,uid=None,passwd=None): 
        obj = self.ldapconn 
        target_cn = self.ldap_search_dn(uid)    
        try: 
            if obj.simple_bind_s(target_cn,passwd): 
                return True
            else: 
                return False
        except ldap.LDAPError,e: 
            print e 

    def ldap_update_pass(self,uid=None,oldpass=None,newpass=None): 
        modify_entry = [(ldap.MOD_REPLACE,'userpassword',newpass)] 
        obj = self.ldapconn 
        target_cn = self.ldap_search_dn(uid)      
        try: 
            obj.simple_bind_s(target_cn,oldpass) 
            obj.passwd_s(target_cn,oldpass,newpass) 
            return True
        except ldap.LDAPError,e: 
            return False

l = LDAPTool()

print l.ldap_get_vaild('zhanglongbao',PASSWORD)
print l.ldap_search_dn('liuqir')
print l.ldap_update_pass('zhanglongbao',PASSWORD,'zlydvd120')
print l.ldap_get_user('zhanglongbao')

print l.ldap_search_dn('*zhanglongbao*')


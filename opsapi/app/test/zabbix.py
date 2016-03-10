from zabbix_client import ZabbixServerProxy
s = ZabbixServerProxy('http://139.129.10.243/zabbix')
s.user.login(user='Admin',password='reboot')

def info_zabbix():
    host = s.host.get(output=['hostid', 'host'])
    hostinterface = s.hostinterface.get(output=['hostid','ip'])

    for ss in host:
        v = {}
        for si in hostinterface:
            if ss['hostid'] == si['hostid']:
                v['hostid'] =  ss['hostid']
                v['host'] =  ss['host']
                v['ip'] = si['ip']
        return v

print info_zabbix()
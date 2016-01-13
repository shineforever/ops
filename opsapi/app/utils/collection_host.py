# * coding:utf-8 *
import psutil,uuid
import socket

class Getinfo_host:

    def __init__(self):
        self.cpu = self.get_cpu_info()
        self.mem = self.get_mem_info()
        self.diskinfo = self.get_disk_info()
        self.ipaddress = self.get_ip_info()
        self.mac = self.get_mac_address()
        self.hostname = self.get_hostname()

    def get_cpu_info(self):
        cpu = psutil.cpu_count()
        return cpu

    def get_mem_info(self):
        mem = psutil.virtual_memory().total/1024/1024/1024

        return mem

    # print "虚拟内存: %dG" % (psutil.swap_memory().total/1024/1024/1024)
    def get_disk_info(self):
        v = {'path':0,
             'mount': 0,
             'useage': 0
             }
        disk = psutil.disk_partitions()
        for d in disk:
            v['path'] = d[0]
            v['mount'] = d[1]
            v['useage'] = psutil.disk_usage(d[1]).total/1024/1024/1024
        return v

    def get_mac_address(self):
        mac = uuid.UUID(int=uuid.getnode()).hex[-12:]
        MAC = ":".join([mac[e : e+2] for e in range(0, 11, 2)])
        return MAC

    def get_ip_info(self):
        o = []
        ip = psutil.net_if_addrs()
        data = []
        for i in ip:
            data.append(ip[i][0][1])
        for v in data:
            if "." in v and "127.0.0.1" not in v:
                o.append(v)
        return o

    def get_hostname(self):
        hostname = socket.gethostname()
        return hostname

if __name__ == "__main__":
    gh = Getinfo_host()
    values = {'hostname':gh.hostname,'cpu':gh.cpu,'mem':gh.mem,'disk':gh.diskinfo,'ip':gh.ipaddress,'mac':gh.mac}
    print values
#!/usr/bin/env python
# coding:utf-8
from app import db
import  inspect

# class Server(db.Model):
#     __tablename__       = "server"
#     id                  = db.Column(db.Integer,primary_key=True)
#     ip                  = db.Column(db.String(100),nullable=False,default='')
#     cabinet_id          = db.Column(db.Integer)
#     sn                  = db.Column(db.String(200),unique=True)
#     status              = db.Column(db.String(200),default='123')
#     idc_room_id         = db.Column(db.String(200),default='12')
#     idc_id              = db.Column(db.Integer,default='123')
#     server_type         = db.Column(db.String(200),default='11')



class User(db.Model):
    """
    用户信息表,表字段如下,
    用户名(拼音) name
    用户名(中文) username
    email邮件   email
    所在部门     department_id
    是否是leader is_leader
    手机号     phone
    """
    __tablename__       = "user"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(50),nullable=False)
    username            = db.Column(db.String(50),nullable=False)
    email               = db.Column(db.String(50),nullable=False)
    department_id       = db.Column(db.Integer,index=True)
    is_leader           = db.Column(db.Integer,index=True,default='0')
    phone               = db.Column(db.String(50))


    def __repr__(self):
        return '<User % r>' % self.name

class Depart(db.Model):
    """
    部门信息表,表字段如下,
    部门名称  department_name
    上级部门  superior
    """
    __tablename__       = "depart"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    department_name     = db.Column(db.String(50))
    superior            = db.Column(db.Integer,default=0)
    path                = db.Column(db.String(50),default='')

    def __repr__(self):
        return '<department_name % r>' % self.department_name


class Idc(db.Model):
    """
    IDC 信息表,表字段如下,
    IDC字母简称  name
    idc名称(中文) idc_name
    IDC详细地址  address
    客服电话    phone
    邮件地址    email
    IDC接口人    user_interface
    接口人电话 user_phone
    实际机柜数 rel_cabinet_num
    合同机柜数 pact_cabinet_num
    """
    __tablename__       = "idc"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(10),index=True,nullable=False,unique=True)
    idc_name            = db.Column(db.String(30),nullable=False)
    address             = db.Column(db.String(255),nullable=False)
    phone               = db.Column(db.String(15),nullable=False)
    email               = db.Column(db.String(30),nullable=False)
    user_interface      = db.Column(db.String(50),nullable=False)
    user_phone          = db.Column(db.String(20),nullable=False)
    rel_cabinet_num     = db.Column(db.Integer,nullable=False)
    pact_cabinet_num    = db.Column(db.Integer,nullable=False)

    def getmember(self):
        return inspect.getmembers((self,inspect.ismethod()))

class Cabinet(db.Model):
    """
    机柜名  name
    所处的机房  idc_id
    机柜功率  power
    """
    __tablename__       = "cabinet"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(50),nullable=False,default='')
    idc_id              = db.Column(db.String(50),index=True,nullable=False,default=0)
    power               = db.Column(db.String(50),default='')
    def __repr__(self):
        return '<name %r>' % self.name

class Manufacturer(db.Model):
    """
    服务器制造商信息表,表字段如下,
    id , 制造商名称
    """
    __tablename__       = "manufacturers"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(50),nullable=True)

class Supplier(db.Model):
    """
    服务器供应商信息表,表字段如下,
    id,服务器供应商名称
    """
    __tablename__       = "supplier"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(100),nullable=True)

class Servertype(db.Model):
    """
    服务器型号表,表字段如下,
    id,type
    """
    __tablename__       = "servertype"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    type                = db.Column(db.String(20),nullable=False)
    manufacturers_id    = db.Column(db.Integer,nullable=False,index=True)

class Raid(db.Model):
    """
    硬盘raid信息表,表字段如下,
    id, Raid信息
    """
    __tablename__       = "raid"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(20),nullable=False)

class Raidtype(db.Model):
    """
    Raid卡型号信息表,表字段如下,
    id,Raid卡型号
    """
    __tablename__       = "raidtype"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(50),nullable=False)

class Status(db.Model):
    """
    服务器状态信息表,表字段如下,
    id,服务器状态(上架,线上,故障...)
    """

    __tablename__       = "status"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    name                = db.Column(db.String(20),nullable=False)

class Product(db.Model):
    """
    业务线信息表,表字段如下,
    id,业务或产品名,所属业务线,业务线字母缩写,开发接口人
    """
    __tablename__       = "product"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    service_name        = db.Column(db.String(20),nullable=False)
    pid                 = db.Column(db.Integer,nullable=False)
    module_letter       = db.Column(db.String(10),nullable=False)
    dev_interface       = db.Column(db.String(100))
    op_interface        = db.Column(db.String(100))
    def __repr__(self):
        return '<dev_interface %r>' % self.dev_interface

class Power(db.Model):
    """
    电源功率信处表,表字段如下,
    id, 功率值
    """
    __tablename__       = "power"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    server_power        = db.Column(db.String(50),nullable=False)
    def __repr__(self):
        return '<server_power %r>' % self.server_power

class IpInfo(db.Model):
    """
    IP信息表,表字段如下,
    id,MAC地址,设备名,所在服务器,所在网络设备,所在端口
    """
    __tablename__       = "ipinfo"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    mac                 = db.Column(db.String(20),nullable=False)
    device              = db.Column(db.String(20),nullable=False)
    server_id           = db.Column(db.Integer,nullable=False,index=True)
    switch_id           = db.Column(db.Integer,nullable=False,index=True)
    switch_port         = db.Column(db.Integer)
    def __repr__(self):
        return 'device %r>' % self.device

class Server(db.Model):
    """
    服务器信息表,表字段如下,
    供应商 supplier
    制造商 manufacturers
    出厂日期 manumanufacturers
    服务器类型 server_type
    st/sn号   st
    自定义资产号 aassets_no
    所属idc   idc_id
    所在机柜   cabinet_id
    机柜内位置  cabinet_pos
    机器到保日期 expire
    有无ups电源  ups
    合作商   parter
    合作方式 parter_type
    机器上架日期  server_up_time
    操作系统类型  os_type
    操作系统版本  os_version
    主机名 hostname
    内网ip   inner_ip
    mac地址  mac_address
    ip信息 ip_info
    cpu型号 server_cpu
    硬盘信息 server_disk
    内存信息  server_mem
    Raid raid
    RAID卡型号  raid_card_type
    远程管理卡类型  remote_card
    远程管理卡ip remote_cardip
    服务器状态  status
    备注   remark
    最后操作时间   last_op_time
    最后操作人   last_op_people
    邮件列表   monitor_mail_group
    主服务/业务线  service_id
    从服务/产品线  server_purpose
    故障处理人   trouble_resolve
    运维接口人   op_interface_other
    开发人接口   dev_interface
    上次检测时间  check_update_time
    是否是虚拟机  vm_status
    电源功率    power
    宿主机      host
    """
    __tablename__       = "server"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    uuid                = db.Column(db.Integer)
    supplier            = db.Column(db.Integer,index=True)
    manufacturers       = db.Column(db.String(50))
    manufacturer_date   = db.Column(db.Date)
    server_type         = db.Column(db.String(50))
    st                  = db.Column(db.String(60),index=True)
    assets_no           = db.Column(db.String(60))
    idc_id              = db.Column(db.Integer,index=True)
    cabinet_id          = db.Column(db.Integer)
    cabinet_pos         = db.Column(db.String(10))
    expire              = db.Column(db.Date)
    ups                 = db.Column(db.Integer)
    parter              = db.Column(db.String(50))
    parter_type         = db.Column(db.String(50))
    server_up_time      = db.Column(db.Date)
    os                 = db.Column(db.String(50))
    # os_version          = db.Column(db.String(10))
    hostname            = db.Column(db.String(32),index=True,nullable=False)
    inner_ip            = db.Column(db.String(32),index=True,nullable=False)
    mac_address         = db.Column(db.String(32))
    ip_info             = db.Column(db.String(300))
    server_cpu          = db.Column(db.String(250))
    server_disk         = db.Column(db.String(250))
    server_mem          = db.Column(db.String(250))
    raid                = db.Column(db.String(10))
    raid_card_type      = db.Column(db.String(50))
    remote_card         = db.Column(db.String(32))
    remote_cardip       = db.Column(db.String(32))
    status              = db.Column(db.Integer,index=True)
    remark              = db.Column(db.Text)
    last_op_time        = db.Column(db.DateTime)
    last_op_people      = db.Column(db.Integer,nullable=True)
    monitor_mail_group  = db.Column(db.String(32))
    service_id          = db.Column(db.Integer,index=True)
    server_purpose      = db.Column(db.Integer,index=True)
    trouble_resolve     = db.Column(db.Integer)
    op_interface_other  = db.Column(db.Integer)
    dev_interface       = db.Column(db.Integer)
    check_update_time   = db.Column(db.DateTime)
    vm_status           = db.Column(db.Integer,index=True)
    power               = db.Column(db.Integer,index=True,default='0')
    host                = db.Column(db.Integer)


class Switch(db.Model):
    """
    网络设备信息表,字段如下,
    网络设备名  switch_name
    网络设备型号  switch_type
    管理ip   manager_ip
    网络设备的类型  category
    所在IDC    idc_id
    所在机柜   cabinet_id
    状态       status
    到保日期    expire
    备注        remark
    制造商       manufacturers
    最后操作时间   last_op_time
    最后操作人     last_op_people
    端口数        switch_port_nums
    """
    __tablename__       = "switch"
    id                  = db.Column(db.Integer,autoincrement=True,primary_key=True)
    switch_name         = db.Column(db.String(50),nullable=False)
    switch_type         = db.Column(db.String(50),nullable=False)
    manager_ip          = db.Column(db.String(50),nullable=False)
    category            = db.Column(db.String(50),nullable=False)
    idc_id              = db.Column(db.Integer,index=True)
    cabinet_id          = db.Column(db.Integer,index=True)
    status              = db.Column(db.Integer,index=True)
    expire              = db.Column(db.Date)
    remark              = db.Column(db.TEXT)
    manufacturers       = db.Column(db.Integer)
    last_op_time        = db.Column(db.DateTime)
    last_op_people      = db.Column(db.Integer)
    switch_port_nums    = db.Column(db.Integer,default=0)

class ZbHost(db.Model):
    __tablename__ = 'zbhost'
    id            = db.Column(db.Integer,primary_key=True)
    cmdb_hostid   = db.Column(db.Integer,index=True,unique=True)
    hostid        = db.Column(db.Integer,index=True,unique=True)
    host          = db.Column(db.String(50))
    ip            = db.Column(db.String(32))

class GraphiteKeys(db.Model):
    __tablename__ = 'graphite_keys'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(200),unique=True)
    type          = db.Column(db.String(20))
    title         = db.Column(db.String(50))
    status        = db.Column(db.Integer,index=True,default=0)

class GraphiteGroupKey(db.Model):
    __tablename__ ='graphite_group_key'
    id            = db.Column(db.Integer,primary_key=True)
    service_id    = db.Column(db.Integer, index=True)



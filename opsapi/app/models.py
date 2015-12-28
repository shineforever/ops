#!/usr/bin/env python
# coding:utf-8
from app import db


class Server(db.Model):
    __tablename__       = 'server'
    id                  = db.Column(db.Integer,primary_key=True)
    ip                  = db.Column(db.String(100),nullable=False,default='')
    cabinet_id          = db.Column(db.Integer)
    sn                  = db.Column(db.String(200),unique=True)
    status              = db.Column(db.String(200),default='123')
    idc_room_id         = db.Column(db.String(200),default='12')
    idc_id              = db.Column(db.Integer,default='123')
    server_type              = db.Column(db.String(200),default='11')

class test(db.Model):
    __tablename__       = "test"
    id                  = db.Column(db.Integer,primary_key=True)

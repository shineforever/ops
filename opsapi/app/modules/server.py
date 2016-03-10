#_*_coding:utf-8_*_
from app.models import db, Server
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Server, params)

    # 传参的个数需要验证
    obj = Server(**params)
    print "getobj"

    # 插入到数据库
    db.session.add(obj)
    print "obj"
    try:
        db.session.commit()
        print "aa"
    except Exception, e:
        print e.message.split()[1]
        raise Exception(e.message)

    return obj.id

def get(**params):
    output = params.get('output',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')
    where = {}
    if params.get('where') and isinstance(params['where'],dict):
        where = params['where']

    check_output_field(Server, output)
    check_order_by(Server, order_by)
    check_limit(limit)

    data = db.session.query(Server).filter_by(**where).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def get_one(**params):
    output = params.get('output',[])
    host_id = params.get('id')
    print id
    data = db.session.query(Server).filter_by(id=host_id).first()

    db.session.close()

    ret= {"hostname": getattr(data, 'hostname')}

    return ret


def update(**params):
    data = params.get('data',{})
    where = params.get('where',{})

    #check_update_params(Server, data, where)

    ret = db.session.query(Server).filter_by(**where).update(data)
    try:
        db.session.commit()
    except Exception,e:
        raise Exception(e.message.split(") ")[1])

    return ret
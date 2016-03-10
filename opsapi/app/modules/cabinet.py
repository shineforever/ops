# coding:utf-8
from app.models import db, Cabinet,Idc,Power
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Cabinet, params)
    check_value_exists(Idc,"name",params.get("idc_id",None))
    check_value_exists(Power,"server_power",params.get("power",None))

    print inspect.getmembers(Cabinet,predicate=inspect.ismethod(id))

    # 传参的个数需要验证
    obj = Cabinet(**params)

    # 插入到数据库
    db.session.add(obj)

    try:
        db.session.commit()
    except Exception,e:
        print e.message.split()[1]
        raise Exception(e.message.split(") ")[1])
    return obj.id

def get(**params):
    output = params.get('output',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')

    check_output_field(Cabinet,output)
    check_order_by(Cabinet,order_by)
    check_limit(limit)
    data = db.session.query(Cabinet).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data',{})
    where = params.get('where',{})

    check_update_params(Cabinet,data,where)

    check_value_exists(Idc,"id",params.get("idc_id",None))
    check_value_exists(Power,"server_power",params.get("power",None))

    ret = db.session.query(Cabinet).filter_by(**where).update(data)
    try:
        db.session.commit()
    except Exception,e:
        print e.message.split()[1]
        raise Exception(e.message.split(") ")[1])

    return ret
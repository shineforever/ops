#_*_coding:utf-8_*_
from app.models import db, Depart
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Depart, params)
    check_value_exists(Depart, "id", params.get("pid", None))

    print inspect.getmembers(Depart,predicate=inspect.ismethod(id))

    # 传参的个数需要验证
    obj = Depart(**params)

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

    check_output_field(Depart,output)
    check_order_by(Depart,order_by)
    check_limit(limit)

    data = db.session.query(Depart).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data',{})
    where = params.get('where',{})

    check_update_params(Depart,data,where)

    if data.get("pid",None) is not None and data['pid'] != 0:
        check_value_exists(Depart, "id", params.get("pid",None))

    ret = db.session.query(Depart).filter_by(**where).update(data)
    try:
        db.session.commit()
    except Exception,e:
        print e.message.split()[1]
        raise Exception(e.message.split(") ")[1])

    return ret
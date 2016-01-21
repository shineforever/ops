#_*_coding:utf-8_*_
from app.models import db, Raid
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Raid, params)

    print inspect.getmembers(Raid,predicate=inspect.ismethod(id))

    # 传参的个数需要验证
    obj = Raid(**params)

    # 插入到数据库
    db.session.add(obj)
    try:
        db.session.commit()
    except Exception,e:
        raise Exception(e.message.split(") ")[1])
    return obj.id

def get(**params):
    output = params.get('output',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')

    check_output_field(Raid, output)
    check_order_by(Raid, order_by)
    check_limit(limit)

    data = db.session.query(Raid).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data', {})
    where = params.get('where', {})

    check_update_params(Raid, data, where)

    ret = db.session.query(Raid).filter_by(**where).update(data)
    try:
        db.session.commit()
    except Exception,e:
        raise Exception(e.message.split(") ")[1])

    return ret
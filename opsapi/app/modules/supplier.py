#_*_coding:utf-8_*_
from app.models import db, Supplier
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Supplier, params)

    print inspect.getmembers(Supplier,predicate=inspect.ismethod(id))

    # 传参的个数需要验证
    obj = Supplier(**params)

    # 插入到数据库
    db.session.add(obj)
    try:
        db.session.commit()
    except Exception, e:
        raise Exception(e.message.split(") ")[1])

    return obj.id

def get(**params):
    output = params.get('output',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')

    check_output_field(Supplier,output)
    check_order_by(Supplier, order_by)
    check_limit(limit)

    data = db.session.query(Supplier).order_by(order_by).limit(limit).all()
    db.session.close()
    logger.debug(data)

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data',{})
    where = params.get('where',{})

    check_update_params(Supplier, data, where)

    ret = db.session.query(Supplier).filter_by(**where).update(data)

    try:
        db.session.commit()
    except Exception,e:
        raise Exception(e.message.split(") ")[1])
    return ret
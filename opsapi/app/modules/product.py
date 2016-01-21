#_*_coding:utf-8_*_
from app.models import db, Product
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Product, params)
    if params.get("pid",0) != 0:
        check_value_exists(Product, "id", params.get("pid",None))

    # 传参的个数需要验证
    obj = Product(**params)

    # 插入到数据库
    db.session.add(obj)

    try:
        db.session.commit()
    except Exception,e:
        print e.message.split()[1]
        raise Exception(e.message.split(") ")[1])

    return obj.id

def get(**params):
    output = params.get('outout',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')

    check_output_field(Product,output)
    check_order_by(Product,order_by)
    check_limit(limit)

    data = db.session.query(Product).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data', {})
    where = params.get('where', {})
    check_update_params(Product, data,where)

    if data.get("pid",None) is not None and data['pid'] != 0:
        check_value_exists(Product, "id" , params.get("pid",None))

    check_update_params(Product,data,where)

    ret = db.session.query(Product).filter_by(**where).update(data)
    try:
        db.session.commit()
    except Exception,e:
        print e.message.split()[1]
        raise Exception(e.message.split(") ")[1])

    return ret
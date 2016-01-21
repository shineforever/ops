#_*_coding:utf-8_*_
from app.models import db, Switch
from app.utils import *
import inspect

def create(**params):
    # 1. 获取参数信息
    check_field_exists(Switch, params)

    print inspect.getmembers(Switch,predicate=inspect.ismethod(id))

    # 传参的个数需要验证
    obj = Switch(**params)

    # 插入到数据库
    db.session.add(obj)
    db.session.commit()
    return obj.id

def get(**params):
    output = params.get('output',[])
    limit = params.get('limit',10)
    order_by = params.get('order_by','id desc')

    check_output_field(Switch,output)
    check_order_by(Switch,order_by)
    check_limit(limit)

    data = db.session.query(Switch).order_by(order_by).limit(limit).all()
    db.session.close()

    ret = process_result(data, output)
    return ret

def update(**params):
    data = params.get('data',{})
    where = params.get('where',{})

    check_update_params(Switch,data,where)

    ret = db.session.query(Switch).filter_by(**where).update(data)
    db.session.commit()

    return ret
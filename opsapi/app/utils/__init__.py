#!/usr/bin/env python
# coding:utf-8

from app import logger

def check_field_exists(obj,data,field_none=[]):
    """
    验证字段是否合法
    验证数据不能为空
    :param data: 需要验证的数据
    :param field_none: 可以为空的字段
    :return:
    """

    for field in data.keys():
        if not hasattr(obj, field):
            # 验证字段是否存在
            raise Exception("params error")
        if not data.get(field,None):
            # 验证字段是否为none
            if data[field] not in field_none:
                raise Exception("{}不能为空".format(field))

def process_result(data, output):
    black = ["_sa_instance_state"]
    print black
    ret = []
    for obj in data:
        if output:
            tmp = {}
            for f in output:
                tmp[f] = getattr(obj,f)
            ret.append(tmp)
        else:
            tmp = obj.__dict__
            for p in black:
                try:
                    tmp.pop(p)
                except:
                    pass
            ret.append(tmp)
    return ret

def check_order_by(obj,order_by=''):
    """
    :param obj:
    :param order_by:
    :return:
    """
    order_by = order_by.split()
    if len(order_by) != 2:
        raise Exception("order by 参数不正确")

    field, order = order_by

    order_list = ["asc", "desc"]
    if order.lower() not in order_list:
        raise  Exception("排序参数不正确,值可以为:{}".format(order_list))

    if not hasattr(obj,field.lower()):
        raise Exception("排序字段不在该字段")

def check_limit(limit):
    if not str(limit).isdigit():
        return Exception("limit 必须为数值")

def check_output_field(obj,output=[]):
    if not isinstance(output, list):
        raise Exception("output必须为列表")

    for field in output:
        if not hasattr(obj,field):
            raise Exception("{}这个输出字段不存在".format(field))

def check_update_params(obj,data,where):
    if not data:
        raise Exception("no data")

    for field in data.keys():
        if not hasattr(obj,field):
            raise Exception("需要更新的{}字段不存在".format(field))

    if not where:
        raise Exception("需要提供where条件 no where".format(where))

    if where.get('id', None) is None:
        if where.get('uuid',None) is None:
            raise Exception("need update condition")

    # try:
    #     id = int(where['id'])
    #     if id <= 0:
    #         raise Exception("条件id的值不能为负数  id")
    # except ValueError:
    #     raise Exception("条件id的值必须为int  ")

    try:
        id = where['id'] if where.has_key('id') else where.get('uuid', 0)
        if int(id) <= 0:
            raise Exception("条件id的值不能为负数")
    except Exception,e:
        raise Exception("条件错误{}".format(e.message))

def check_value_exists(obj,name,value):
    from app.models import db
    where = {name: value}
    ret = db.session.query(obj).filter_by(**where).first()
    print ret
    print where
    if not ret:
        raise Exception("{}不存在".format(value))
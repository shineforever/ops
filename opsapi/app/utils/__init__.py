# coding:utf-8
__author__ = 'albert233'

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
                raise Exception("{}不能为空")

def process_result(data, output):
    black = ["_sa_instance_state"]
    ret = []
    for obj in data:
        if output:
            tmp = {}
            for f in input:
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


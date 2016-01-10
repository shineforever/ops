__author__ = 'albert233'

def check_field_exists(obj,data,field_none=[]):
    for field in data.keys():
        if not hasattr(obj,field):
            raise Exception("")
        if not data.get(field,None):
            if data[field] not in field_none:
                raise Exception("{}不能为空")

# def process_result(obj,data,output):
#     black = ["_sa_instance_state"]
#     ret = []
#     for obj in
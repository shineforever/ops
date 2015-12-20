file_data = {}

def updata_data():
    f = open('test02.log')
    for line in f:
        if not line:
            continue
        temp_arr = line.split(':')
        file_data[temp_arr[0]]=temp_arr[1]

def get_table_html():
    tem_str = '<table>'
    tem_str += '<tr><td>name</td><td>age</td></tr>'
    for name,age in file_data.items():
        tem_str+='<tr><td>%s</td><td>%s</td></tr>'%(name,age)
    tem_str += '</table>'
    return tem_str
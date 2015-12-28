file_data = {}

def update_data():
    f = open('test02.log')
    for line in f:
        if not line:
            continue
        temp_arr = line.split(':')
        file_data[temp_arr[0]]=temp_arr[1]

def update_file():
    f = open('test02.log','w')
    tem_arr = []
    for name.age in file_data.items():
        tem_arr.append('%s:%s\n'%(name,age))
    tem_arr[-1] = tem_arr[-1].replace['\n','']
    f.writelines(tem_arr)
    f.close()

def get_table_html():
    tem_str = '<table border="1">'
    tem_str += '<tr><td>name</td><td>age</td><td>action</td></tr>'
    for name,age in file_data.items():
        tem_str+='<tr><td>%s</td><td>%s</td><td><a href="/delete?name=%s">delete</a></td></tr>'%(name,age,name)
    tem_str += '</table>'
    return tem_str

def add_form_html():
    return '''
            <form action="/add">
            name:<input type="text" name="name">
            age:<input type="text" name="age">
            <input type="submit" value="add">
            </form>
        '''

def get_all_html():
    return add_form_html()+get_table_html()
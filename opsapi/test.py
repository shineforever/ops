from  flask import Flask,request,render_template
import util
app = Flask(__name__)

@app.route('/delete',methods=['GET'])


# def index():
#     # print request.args
#     id = request.args.get('id')
#     if id:
#         # msg = 'delete id ' + id
#         # msg = '<button>' + id + '</button>'
#         msg = '<input type="text" value=' + id + '>'
#     else:
#         msg = 'error! need an id'
#     return msg

def delete():
    return  render_template('delete.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    name = request.args.get('name')
    print name
    return 'hello world :' + name

@app.route('/open')
def index1():
    datas = open('test02.log')
    print datas.read().split('\n')
    return render_template('test.html')

@app.route('/dr')
def dr():
    string = []
    name = []
    age = []
    f = open('test02.log')

    for key, line in enumerate(f.readlines()):

        name.append(line.strip('\n').split(':')[0])
        age.append(line.strip('\n').split(':')[1])
        string.append('<tr><td>' + name[key] + '</td><td>' + age[key] + '</td><tr>')
    table_str = ('').join(string)

    return '<table border="1">' + table_str + '</table>'


util.updata_data()
print util.file_data

@app.route('/data')
def data():
    return util.get_table_html()

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)















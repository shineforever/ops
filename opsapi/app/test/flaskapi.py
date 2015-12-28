from flask import Flask , request

import util

app = Flask(__name__)

util.update_data()

@app.route('/')
def index():
    return util.get_all_html()

@app.route('/add')
def add():
    name = request.args.get('name')
    age = request.args.get('age')
    res = util.get_all_html()
    if not name or not age:
        res = '<p>need name and age</p>' + res
    elif name in util.file_data:
        res = '<p>name alread exists</p>' + res
    else:
        util.file_data[name] = age
        util.update_data()
        res = util.get_all_html()
    return res

@app.route('/delete')
def delete():
    name = request.args.get('name')
    res = util.get_all_html()
    if name and name in util.file_data:
        del util.file_data[name]
        util.update_data()
        res = util.get_all_html()
    else:
        res = '<p>invaild name</p>' + res
    return res

if __name__ == '__main__':
    app.run(host="0.0.0.0",port=8000,debug=True)
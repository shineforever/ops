from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from config import config

app = Flask(__name__)
app.config.from_object(config['production'])
db = SQLAlchemy(app)

print app.config
print db.session.query_property()


def init(**params):
    return "nihao"

def get(**params):
    print 'hello %s' %params.get('name')
    return 'hello %s' %params.get('name')

def create():
    print 'add data'

def update():
    print 'update data'
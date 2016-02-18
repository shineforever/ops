#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
from flask import request, render_template
import json
from . import main
from app.core.base import JsonRpc
from app import logger

from datetime import date, datetime

class CjsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(obj, date):
            return obj.strftime("%Y-%m-%d")
        else:
            return json.JSONEncoder.default(self, obj)

@main.route('/', methods=['GET','POST'])
def index():
    return render_template("dashboard.html")

@main.route("/api",methods=["GET","POST"])
def api():

    logger.debug("log:test")

    allowed_contents = {
        'application/json-rpc':"json-rpc",
        'application/json':"json-rpc",
    }
    if allowed_contents.get(request.content_type,None):
        jsonData = json.loads(request.get_json())
        jsonrpc = JsonRpc(jsonData)
        ret = jsonrpc.execute()
        return json.dumps(ret,cls=CjsonEncoder)
    else:
        return "404", 404

#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
from flask import request, render_template
import json
from . import main
from app.core.base import JsonRpc
from app import logger

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
        return json.dumps(ret)
    else:
        return "404" , 404

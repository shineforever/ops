#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
from flask import request
import json
from . import main
from app.core.base import JsonRpc
import logging

@main.route('/', methods=['GET','POST'])
def index():
    return 'index'

@main.route("/api",methods=["GET","POST"])
def api():
    # logging.DEBUG("API 被调用")
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

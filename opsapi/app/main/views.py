#!/usr/bin/env python
# coding:utf-8
from __future__ import unicode_literals
from . import main

@main.route('/', methods=['GET','POST'])
def index():
    return 'index'

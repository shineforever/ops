# -*- coding: utf-8    -*- 
from django.shortcuts import render_to_response 
address = [ 
  {'name':'alan', 'sex':'男','age':'25','address':'河南省郑州市'}, 
  {'name':'阿汐', 'sex':'男','age':'21','address':'河南省郑州市'}, 
  {'name':'sgicer', 'sex':'男','age':'23','address':'河南省郑州市'}, 
  {'name':'tidewind', 'sex':'男','age':'32','address':'河南省安阳市'}, 
  {'name':'cood', 'sex':'男','age':'22','address':'河南省安阳市'}, 
  {'name':'北极乞丐', 'sex':'男','age':'25','address':'河南省郑州市'}, 
  {'name':'北斗', 'sex':'男','age':'15','address':'河南省安阳市'} 
        ] 
def index(request): 
        return render_to_response('list.html',{'address': address})
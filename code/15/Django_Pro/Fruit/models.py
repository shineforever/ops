# encoding=utf-8
from django.db import models

class Fruit(models.Model):
    name = models.CharField('水果名称',max_length=20)
    facturer = models.CharField('厂商',max_length=20)
    price = models.FloatField('单价',max_length=255)
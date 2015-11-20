from django.db import models

class MySite(models.Model):
	name = models.CharField(max_length=30)
	site = models.URLField()
	author = models.CharField(max_length=30)
	date = models.CharField(max_length=100)

	class Meta:
		ordering = ['name']
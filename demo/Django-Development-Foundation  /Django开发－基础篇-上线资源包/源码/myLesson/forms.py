from django import forms

class BookForms(forms.Form):
	title = forms.CharField(max_length=20)
	author = forms.CharField(max_length=20)
	date = forms.CharField(max_length=20)
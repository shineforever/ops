from django.shortcuts import render_to_response
from django.http import HttpResponse
from myLesson.forms import *
# Create your views here.

def hello(request):
	if request.method == 'POST':
		form = BookForms(request.POST)
		if form.is_valid():
			data = form.cleaned_data
			title = data["title"]
			return HttpResponse(title)
	form = BookForms()
	return render_to_response('1.html', {'form':form})
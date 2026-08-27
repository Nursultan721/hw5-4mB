from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, "index.html", locals())

def profile(request):
    return render(request, "pages/profile.html", locals())

def login_view(request):
    return render(request, "pages/profile.html", locals())

def register(request):
    return render(request, "pages/profile.html", locals())
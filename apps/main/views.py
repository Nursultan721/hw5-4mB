from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from apps.main.models import User, SiteConfig


def index(request):
    return render(request, "index.html", locals())


@login_required
def profile(request):
    return render(request, "pages/profile.html", locals())


def login_view(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect("profile")

        messages.error(request, "Неверный email или пароль")
        return redirect("login")

    return render(request, "pages/login.html", locals())


def register(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        password2 = request.POST.get("password2", "")

        if not name or not email or not password:
            messages.error(request, "Заполните все поля")
            return redirect("register")

        if password != password2:
            messages.error(request, "Пароли не совпадают")
            return redirect("register")

        if User.objects.filter(username=email).exists():
            messages.error(request, "Такой пользователь уже существует")
            return redirect("register")

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=name,
            password=password
        )

        login(request, user)

        return redirect("profile")

    return render(request, "pages/register.html", locals())


def logout_view(request):
    logout(request)
    return redirect("home")
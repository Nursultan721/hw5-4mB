from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from apps.main.views import (
    index,
    register,
    profile,
    login_view,
    logout_view,
)


urlpatterns = [
    path('admin/', admin.site.urls),

    path('', index, name='home'),

    path('register/', register, name='register'),

    path('profile/', profile, name='profile'),

    path('login-page/', login_view, name='login'),

    path('logout/', logout_view, name='logout'),
]


urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)
from django.contrib import admin
from apps.main.models import SiteConfig, User


# Register your models here.
admin.site.register(SiteConfig)
admin.site.register(User)
from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class SiteConfig(models.Model):
    title = models.CharField(max_length=100, verbose_name="Название сайта")
    description = models.TextField(verbose_name="Описание сайта")
    email = models.EmailField(verbose_name="Email")
    phone = models.CharField(max_length=100, verbose_name="Контактный номер")
    logo = models.ImageField(upload_to='settings/', verbose_name="Логотип сайта")

    class Meta:
        verbose_name_plural = "Настройки сайта"


class User(AbstractUser):
    about = models.TextField(verbose_name="О нас", blank=True, null=True)
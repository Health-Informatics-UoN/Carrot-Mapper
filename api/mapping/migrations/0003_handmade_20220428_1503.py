# Generated by Django 3.1.14 on 2022-04-28 11:10

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mapping', '0001_initial'),
        ('mapping', '0002_auto_20220428_1110')
    ]

    operations = [
        migrations.RemoveField(
            model_name='scanreport',
            name='data_partner',
        ),
    ]

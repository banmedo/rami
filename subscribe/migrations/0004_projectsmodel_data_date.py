# Generated by Django 3.0.2 on 2020-02-17 20:48

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('subscribe', '0003_auto_20200211_1053'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectsmodel',
            name='data_date',
            field=models.DateTimeField(blank=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]

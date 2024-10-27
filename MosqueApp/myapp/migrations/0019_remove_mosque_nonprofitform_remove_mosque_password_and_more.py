# Generated by Django 5.0.6 on 2024-10-27 02:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0018_alter_customuser_latitude_alter_customuser_longitude_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='mosque',
            name='nonprofitform',
        ),
        migrations.RemoveField(
            model_name='mosque',
            name='password',
        ),
        migrations.AlterField(
            model_name='mosque',
            name='address',
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='mosque',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='mosque',
            name='email',
            field=models.CharField(max_length=100, unique=True),
        ),
        migrations.AlterField(
            model_name='mosque',
            name='prayer_times',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AlterField(
            model_name='mosque',
            name='profile_pic',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.DeleteModel(
            name='PrayerTimeImage',
        ),
    ]

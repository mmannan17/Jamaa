# Generated by Django 5.0.6 on 2024-10-27 03:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0021_post_nonprofitform'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='nonprofitform',
        ),
        migrations.AddField(
            model_name='mosque',
            name='nonprofitform',
            field=models.FileField(blank=True, default='placeholder.pdf', null=True, upload_to='mosque_verification/'),
        ),
    ]
# Generated by Django 5.0.6 on 2024-06-18 03:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0010_remove_mosque_grid_cell_lat_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='mosque',
            name='grid_cell_lat',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='mosque',
            name='grid_cell_lon',
            field=models.IntegerField(default=0),
        ),
    ]

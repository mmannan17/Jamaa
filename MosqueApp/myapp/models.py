from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    USER_ROLE_CHOICES = (
        ('mosque', 'Mosque'),
        ('user', 'User'),
        ('guest', 'Guest')
    )
    role = models.CharField(max_length=10, choices=USER_ROLE_CHOICES)
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

class Mosque(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    mosque_id = models.AutoField(primary_key=True)
    mosquename = models.CharField(max_length=50)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    profile_pic = models.CharField(max_length=255, blank=True)
    prayer_times = models.CharField(max_length=255)
    address = models.CharField(max_length=255, unique=True)

    class Meta:
        permissions = [
            ("can_change_prayer_times", "Can change prayer times"),
            ("can_post_announcements", "Can post announcements"),
            ("can_put_up_events", "Can put up events"),
            ("can_post_media", "Can post pictures and videos"),
        ]

class Post(models.Model):
    post_id = models.AutoField(primary_key=True)
    mosque = models.ForeignKey(Mosque, on_delete=models.CASCADE)
    posttype = models.TextField(max_length=30, blank=True)
    content = models.TextField()
    media_type = models.CharField(max_length=20, blank=True)
    media_url = models.CharField(max_length=255, blank=True)
    events = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(CustomUser, related_name='liked_posts', blank=True)

class Follow(models.Model):
    follow_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    mosque = models.ForeignKey(Mosque, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('user', 'mosque'),)

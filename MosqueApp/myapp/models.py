from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models



class CustomUser(AbstractUser):
    USER_ROLE_CHOICES = (
        ('mosque', 'Mosque'),
        ('user', 'User'),
        ('guest', 'Guest')
    )
    role = models.CharField(max_length=10, choices=USER_ROLE_CHOICES)
    latitude = models.FloatField(default=0.0,null=True)
    longitude = models.FloatField(default=0.0,null=True)
    grid_cell_lat = models.IntegerField(default=0.0)
    grid_cell_lon = models.IntegerField(default=0.0)
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
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    mosque_id = models.AutoField(primary_key=True)
    mosquename = models.CharField(max_length=50)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255,blank=False, null=False,default='')
    description = models.TextField(blank=True, null=True)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)
    prayer_times = models.JSONField(default=dict, null=True, blank=True)
    address = models.CharField(max_length=255, unique=True)
    lat = models.FloatField(default=0.0)
    lon = models.FloatField(default=0.0)
    grid_cell_lat = models.IntegerField(default=0)
    grid_cell_lon = models.IntegerField(default=0)
    nonprofitform = models.FileField(upload_to='mosque_verification/', blank=True, null=True,default='placeholder.pdf')

    class Meta:
        permissions = [
            ("can_change_prayer_times", "Can change prayer times"),
            ("can_post_announcements", "Can post announcements"),
            ("can_put_up_events", "Can put up events"),
            ("can_post_media", "Can post pictures and videos"),
        ]

class Post(models.Model):
    POST_TYPES = [
        ('announcement', 'Announcement'),
        ('media', 'Media Post'),  # For posts with pictures or videos
        ('event', 'Event')
    ]

    post_id = models.AutoField(primary_key=True)
    mosque = models.ForeignKey('Mosque', on_delete=models.CASCADE, related_name='posts')  # Connect to Mosque model
    title = models.CharField(max_length=32,blank=True)
    posttype = models.CharField(max_length=20, choices=POST_TYPES)  # Type of post: Announcement, Media, Event
    content = models.TextField(blank=True)  # Content of the post (can be blank for media-only posts)
    media_type = models.CharField(max_length=20, blank=True)  # Optional: 'image' or 'video'
    media_file = models.URLField(blank=True, null=True)  # URL for image/video file from S3
    event_details = models.CharField(max_length=255, blank=True)  # Event-specific details (optional)
    event_date = models.DateTimeField(blank=True, null=True)  # Event date and time (for event posts)
    likes = models.ManyToManyField(CustomUser, related_name='liked_posts', blank=True)  # Tracks users who liked the post
    timestamp = models.DateTimeField(auto_now_add=True)  # Automatically set when the post is created
    
    def __str__(self):
        return f'{self.mosque.mosquename} - {self.posttype} - {self.content[:30]}...'

class Follow(models.Model):
    follow_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    mosque = models.ForeignKey(Mosque, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('user', 'mosque'),)


class Events(models.Model):
    mosque = models.ForeignKey(Mosque, on_delete=models.CASCADE, related_name='events')
    event_title = models.CharField(max_length=255)
    event_date = models.DateTimeField()
    location = models.CharField(max_length=255)
    event_description = models.TextField()
    rsvp = models.BooleanField(default=False)

    def __str__(self):
        return self.event_title
    



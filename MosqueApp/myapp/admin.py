
from django.contrib import admin
from .models import Mosque, User, Post, Follow



from django.contrib import admin
from .models import Mosque, User, Post, Follow

class MosqueAdmin(admin.ModelAdmin):
    list_display = ('mosque_id', 'mosquename', 'email', 'address')
    search_fields = ('mosquename', 'address')

class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'username', 'email')
    search_fields = ('username', 'email')

class PostAdmin(admin.ModelAdmin):
    list_display = ('post_id', 'mosque', 'content', 'timestamp')
    search_fields = ('mosque__mosquename', 'content')

class FollowAdmin(admin.ModelAdmin):
    list_display = ('follow_id', 'user', 'mosque')
    search_fields = ('user__username', 'mosque__mosquename')



admin.site.register(Mosque)
admin.site.register(User)
admin.site.register(Post)
admin.site.register(Follow)
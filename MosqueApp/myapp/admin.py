from django.contrib import admin
from .models import Mosque, CustomUser, Post, Follow, Events, Organization

class MosqueAdmin(admin.ModelAdmin):
    list_display = ('mosque_id', 'mosquename', 'email', 'address')
    search_fields = ('mosquename', 'address')

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email')
    search_fields = ('username', 'email')

class PostAdmin(admin.ModelAdmin):
    list_display = ('post_id', 'mosque', 'content', 'timestamp')
    search_fields = ('mosque__mosquename', 'content')

class FollowAdmin(admin.ModelAdmin):
    list_display = ('follow_id', 'user', 'mosque')
    search_fields = ('user__username', 'mosque__mosquename')

class EventsAdmin(admin.ModelAdmin):
    list_display = ('id', 'mosque', 'event_title', 'event_date', 'location')
    search_fields = ('mosque__mosquename', 'event_title', 'location')

class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('organization_id', 'organization_name', 'organization_bio')
    search_fields = ('organization_name', 'organization_bio')

admin.site.register(Mosque, MosqueAdmin)
admin.site.register(CustomUser, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Events, EventsAdmin)
admin.site.register(Organization, OrganizationAdmin)

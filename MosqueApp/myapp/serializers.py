from rest_framework import serializers
from .models import CustomUser, Mosque, Post, Follow, Events
from .utils import get_grid
from django import forms
from .updatelocation import get_location

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Events
        fields = ['id', 'mosque', 'event_title', 'event_date', 'location', 'event_description', 'rsvp']

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['post_id', 'mosque','title', 'posttype', 'content', 'media_type', 'media_file', 'event_details', 'event_date', 'timestamp', 'likes'] 

class MosqueSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    events = EventSerializer(many=True, read_only=True)  # Include events

    class Meta:
        model = Mosque
        fields = ['mosque_id', 'mosquename', 'email', 'description', 'profile_pic', 'prayer_times', 'address', 'lat', 'lon', 'grid_cell_lat', 'grid_cell_lon', 'nonprofitform', 'posts', 'events']

class CustomUserSerializer(serializers.ModelSerializer):
    address = serializers.CharField(required=False)
    mosque = MosqueSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'password', 'latitude', 'longitude', 'address', 'mosque']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        role = data.get('role')
        if role == 'mosque' and not data.get('address'):
            raise serializers.ValidationError({'address': 'Address is required for mosque role'})
        return data

    def create(self, validated_data):
        address = validated_data.pop('address', None)
        user = CustomUser(
            email=validated_data['email'],
            username=validated_data['username'],
            role=validated_data['role'],
            latitude=validated_data.get('latitude', 0.0),
            longitude=validated_data.get('longitude', 0.0)
        )
        user.set_password(validated_data['password'])
        user.save()

        if user.role == 'mosque' and address:
            user.address = address
            user.save()
            lat, lon = get_location(address)
            if lat is not None and lon is not None:
                grid_lat, grid_lon = get_grid(lat, lon)
                Mosque.objects.create(
                    user=user, email=user.email, mosquename=user.username, address=address,
                    lat=lat, lon=lon, grid_cell_lat=grid_lat, grid_cell_lon=grid_lon
                )
        
        return user

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = '__all__'

class PostEventForm(forms.ModelForm):
    class Meta:
        model = Events
        fields = ['mosque', 'event_title', 'event_date', 'location', 'event_description', 'rsvp']

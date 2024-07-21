from rest_framework import serializers
from .models import CustomUser, Mosque, Post, Follow
from .utils import get_grid
from .updatelocation import get_location

class CustomUserSerializer(serializers.ModelSerializer):
    address = serializers.CharField(required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'password', 'latitude', 'longitude', 'address']
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

class MosqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mosque
        fields = '__all__'

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['title', 'description', 'media_file', 'mosque', 'content']

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = '__all__'

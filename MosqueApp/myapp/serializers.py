from rest_framework import serializers
from .models import CustomUser, Mosque, Post, Follow

class CustomUserSerializer(serializers.ModelSerializer):
    address = serializers.CharField(required=False)  # Add address field

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'password', 'address']
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
            role=validated_data['role']
        )
        user.set_password(validated_data['password'])
        user.save()
        if user.role == 'mosque' and address:
            user.address = address
            user.save()
        return user

class MosqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mosque
        fields = '__all__'

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = '__all__'

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = '__all__'

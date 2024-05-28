from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Mosque, Post, Follow
from .serializers import CustomUserSerializer, MosqueSerializer, PostSerializer, FollowSerializer
from django.contrib.auth.models import Permission



from django.http import HttpResponse

def index(request):
    return HttpResponse("Welcome to the Mosque App")

class RegisterUserView(APIView):
    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user.role == 'mosque':
                permissions = [
                    Permission.objects.get(codename='can_change_prayer_times'),
                    Permission.objects.get(codename='can_post_announcements'),
                    Permission.objects.get(codename='can_put_up_events'),
                    Permission.objects.get(codename='can_post_media'),
                ]
                user.user_permissions.set(permissions)
                Mosque.objects.create(user=user, email=user.email, mosquename=user.username, address=user.address)
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdateMosqueView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, mosque_id):
        try:
            return Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            return None

    def put(self, request, mosque_id):
        mosque = self.get_object(mosque_id)
        if mosque is None:
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != mosque.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MosqueSerializer(mosque, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FollowMosqueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, mosque_id):
        try:
            mosque = Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        Follow.objects.get_or_create(user=request.user, mosque=mosque)
        return Response({'status': 'Mosque followed'}, status=status.HTTP_200_OK)

    def delete(self, request, mosque_id):
        try:
            mosque = Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        Follow.objects.filter(user=request.user, mosque=mosque).delete()
        return Response({'status': 'Mosque unfollowed'}, status=status.HTTP_200_OK)

class PostAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_perm('myapp.can_post_announcements'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_perm('myapp.can_post_media'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_perm('myapp.can_put_up_events'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LikePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        post.likes.add(request.user)
        return Response({'status': 'Post liked'}, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        post.likes.remove(request.user)
        return Response({'status': 'Post unliked'}, status=status.HTTP_200_OK)

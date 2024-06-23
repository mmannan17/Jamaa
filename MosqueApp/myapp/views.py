from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Mosque, Post, Follow
from .serializers import CustomUserSerializer, MosqueSerializer, PostSerializer, FollowSerializer
from django.contrib.auth.models import Permission
from .updatelocation import get_location
from .utils import get_grid
from django.core.cache import cache
import logging
from django.http import HttpResponse

logger = logging.getLogger(__name__)

def index(request):
    return HttpResponse("Welcome to the Mosque App")


class RegisterUserView(APIView):
    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            role = validated_data['role']

            if role == 'mosque':
                address = request.data.get('address')
                lat, lon = get_location(address)
                
                if lat is None or lon is None:
                    return Response({'error': 'Invalid address'}, status=status.HTTP_400_BAD_REQUEST)
                
                grid_lat, grid_lon = get_grid(lat, lon)

                user = CustomUser.objects.create(
                    username=validated_data['username'],
                    email=validated_data['email'],
                    role=role,
                    latitude=lat,
                    longitude=lon,
                )
                user.set_password(validated_data['password'])
                user.save()
                
                permissions = [
                    Permission.objects.get(codename='can_change_prayer_times'),
                    Permission.objects.get(codename='can_post_announcements'),
                    Permission.objects.get(codename='can_put_up_events'),
                    Permission.objects.get(codename='can_post_media'),
                ]
                user.user_permissions.set(permissions)
                
                mosque = Mosque.objects.create(
                    user=user,
                    email=user.email,
                    mosquename=user.username,
                    address=address,
                    lat=lat,
                    lon=lon,
                    grid_cell_lat=grid_lat,
                    grid_cell_lon=grid_lon,
                )
                
                cache_key = f'grid_{grid_lat}_{grid_lon}'
                cache_mosques = cache.get(cache_key, [])
                cache_mosques.append(mosque)
                cache.set(cache_key, cache_mosques, timeout=86400)
                logger.debug(f"Set cache for key: {cache_key} with mosque: {mosque}")

            elif role == 'user':
                latitude = request.data.get('latitude')
                longitude = request.data.get('longitude')

                grid_lat, grid_lon = get_grid(latitude, longitude)

                user = CustomUser.objects.create(
                    username=validated_data['username'],
                    email=validated_data['email'],
                    role=role,
                    latitude=latitude,
                    longitude=longitude,
                    grid_cell_lat=grid_lat,
                    grid_cell_lon=grid_lon,
                )
                user.set_password(validated_data['password'])
                user.save()

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


class NearbyMosquesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = float(request.query_params.get('lat'))
        lon = float(request.query_params.get('lon'))
        distance = int(request.query_params.get('distance', 1))  

        grid_lat, grid_lon = get_grid(lat, lon)
        mosques = []

        for dlat in range(-distance, distance + 1):
            for dlon in range(-distance, distance + 1):
                cache_key = f'grid_{grid_lat + dlat}_{grid_lon + dlon}'
                cached_mosques = cache.get(cache_key, [])
                if cached_mosques is None:
                    cached_mosques = list(Mosque.objects.filter(
                        grid_cell_lat=grid_lat + dlat,
                        grid_cell_lon=grid_lon + dlon
                    ))
                    cache.set(cache_key, cached_mosques, timeout=86400)

                logger.debug(f"Retrieved cache for key: {cache_key} with mosques: {cached_mosques}")
                mosques.extend(cached_mosques)

        serializer = MosqueSerializer(mosques, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MosqueVerificationView(APIView):
    permission_classes=[IsAuthenticated]

    


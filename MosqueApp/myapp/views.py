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
import time
from django.conf import settings
from django.core.cache.backends.base import DEFAULT_TIMEOUT

logger = logging.getLogger(__name__)

def index(request):
    return HttpResponse("Welcome to the Mosque App")


CACHE_TTL = getattr(settings, 'CACHE_TTL', DEFAULT_TIMEOUT)

class RegisterUserView(APIView):
    def post(self, request):
        logger.info("Starting user registration")
        start_time = time.time()

        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            role = validated_data['role']
            logger.info(f"Validation successful for role: {role}")

            if role == 'mosque':
                address = request.data.get('address')
                lat, lon = get_location(address)
                logger.info(f"Retrieved location for address {address}: lat={lat}, lon={lon}")

                if lat is None or lon is None:
                    return Response({'error': 'Invalid address'}, status=status.HTTP_400_BAD_REQUEST)
                
                grid_lat, grid_lon = get_grid(lat, lon)

                user_start_time = time.time()
                user = CustomUser.objects.create(
                    username=validated_data['username'],
                    email=validated_data['email'],
                    role=role,
                    latitude=lat,
                    longitude=lon,
                )
                user.set_password(validated_data['password'])
                user.save()
                user_creation_time = time.time() - user_start_time
                logger.info(f"Created user: {user} in {user_creation_time:.2f} seconds")

                permissions = [
                    Permission.objects.get(codename='can_change_prayer_times'),
                    Permission.objects.get(codename='can_post_announcements'),
                    Permission.objects.get(codename='can_put_up_events'),
                    Permission.objects.get(codename='can_post_media'),
                ]
                user.user_permissions.set(permissions)
                logger.info(f"Assigned permissions to user: {permissions}")

                mosque_start_time = time.time()
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
                mosque_creation_time = time.time() - mosque_start_time
                logger.info(f"Created mosque: {mosque} in {mosque_creation_time:.2f} seconds")

                cache_key = f'grid_{grid_lat}_{grid_lon}'
                cache_start_time = time.time()
                with cache.lock(cache_key):
                    cache_mosques = cache.get(cache_key, [])
                    cache_mosques.append(mosque)
                    cache.set(cache_key, cache_mosques, timeout=CACHE_TTL)
                cache_update_time = time.time() - cache_start_time
                logger.debug(f"Set cache for key: {cache_key} with mosque: {mosque} in {cache_update_time:.2f} seconds")

            elif role == 'user':
                latitude = request.data.get('latitude')
                longitude = request.data.get('longitude')

                grid_lat, grid_lon = get_grid(latitude, longitude)

                user_start_time = time.time()
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
                user_creation_time = time.time() - user_start_time
                logger.info(f"Created user: {user} in {user_creation_time:.2f} seconds")

            refresh = RefreshToken.for_user(user)

            total_time = time.time() - start_time
            logger.info(f"Total registration time: {total_time:.2f} seconds")

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        logger.error(f"User registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateMosqueView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, mosque_id):
        try:
            return Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            logger.error(f"Mosque with id {mosque_id} not found")
            return None

    def put(self, request, mosque_id):
        logger.info(f"Starting update for mosque id: {mosque_id}")
        mosque = self.get_object(mosque_id)
        if mosque is None:
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != mosque.user:
            logger.error(f"Permission denied for user {request.user} to update mosque {mosque_id}")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MosqueSerializer(mosque, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Updated mosque: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"Update mosque failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FollowMosqueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, mosque_id):
        logger.info(f"User {request.user} attempting to follow mosque id: {mosque_id}")
        try:
            mosque = Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            logger.error(f"Mosque with id {mosque_id} not found")
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        Follow.objects.get_or_create(user=request.user, mosque=mosque)
        logger.info(f"User {request.user} followed mosque {mosque_id}")
        return Response({'status': 'Mosque followed'}, status=status.HTTP_200_OK)

    def delete(self, request, mosque_id):
        logger.info(f"User {request.user} attempting to unfollow mosque id: {mosque_id}")
        try:
            mosque = Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            logger.error(f"Mosque with id {mosque_id} not found")
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        Follow.objects.filter(user=request.user, mosque=mosque).delete()
        logger.info(f"User {request.user} unfollowed mosque {mosque_id}")
        return Response({'status': 'Mosque unfollowed'}, status=status.HTTP_200_OK)


class PostAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} attempting to post announcement")
        if not request.user.has_perm('myapp.can_post_announcements'):
            logger.error(f"Permission denied for user {request.user} to post announcement")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Announcement posted: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Post announcement failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} attempting to post media")
        if not request.user.has_perm('myapp.can_post_media'):
            logger.error(f"Permission denied for user {request.user} to post media")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Media posted: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Post media failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} attempting to post event")
        if not request.user.has_perm('myapp.can_put_up_events'):
            logger.error(f"Permission denied for user {request.user} to post event")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Event posted: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Post event failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LikePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        logger.info(f"User {request.user} attempting to like post id: {post_id}")
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            logger.error(f"Post with id {post_id} not found")
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        post.likes.add(request.user)
        logger.info(f"Post {post_id} liked by user {request.user}")
        return Response({'status': 'Post liked'}, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        logger.info(f"User {request.user} attempting to unlike post id: {post_id}")
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            logger.error(f"Post with id {post_id} not found")
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        post.likes.remove(request.user)
        logger.info(f"Post {post_id} unliked by user {request.user}")
        return Response({'status': 'Post unliked'}, status=status.HTTP_200_OK)


class NearbyMosquesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = float(request.query_params.get('lat'))
        lon = float(request.query_params.get('lon'))
        distance = int(request.query_params.get('distance', 1))  
        logger.info(f"User {request.user} requesting nearby mosques for lat: {lat}, lon: {lon}, distance: {distance}")

        grid_lat, grid_lon = get_grid(lat, lon)
        mosques = []

        start_time = time.time()

        for dlat in range(-distance, distance + 1):
            for dlon in range(-distance, distance + 1):
                cache_key = f'grid_{grid_lat + dlat}_{grid_lon + dlon}'
                cache_start_time = time.time()
                cached_mosques = cache.get(cache_key)

                if cached_mosques is None:
                    logger.debug(f"Cache miss for key: {cache_key}. Populating cache.")
                    mosques_in_grid = list(Mosque.objects.filter(
                        grid_cell_lat=grid_lat + dlat,
                        grid_cell_lon=grid_lon + dlon
                    ).only('id', 'mosquename', 'address'))  # Optimize the query to only fetch required fields
                    cache.set(cache_key, mosques_in_grid, timeout=86400)
                    logger.debug(f"Cache populated for key: {cache_key}")
                else:
                    mosques.extend(cached_mosques)
                    cache_time = time.time() - cache_start_time
                    logger.debug(f"Cache hit for key: {cache_key} in {cache_time:.2f} seconds")

        total_time = time.time() - start_time
        logger.info(f"Nearby mosques fetched in {total_time:.2f} seconds")

        serializer = MosqueSerializer(mosques, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class MosqueVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} attempting to verify mosque")
        # Add your verification logic here
        return Response({'status': 'Mosque verification logic not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

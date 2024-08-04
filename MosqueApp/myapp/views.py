from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Mosque, Post, Follow
from .serializers import CustomUserSerializer, MosqueSerializer, PostEventForm, PostSerializer,FollowSerializer
from django.contrib.auth.models import Permission
from .updatelocation import get_location
from .utils import get_grid
from django.core.cache import cache
from .models import Events
import logging
from django.http import HttpResponse
import time
from django.conf import settings
from django.core.cache.backends.base import DEFAULT_TIMEOUT
from rest_framework.generics import ListAPIView, RetrieveAPIView
from .utils import haversine,get_grid,GRID_SIZE
from django.db.models import Q
from django.shortcuts import get_object_or_404
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
        
        serializer = PostEventForm(data=request.data)
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


# views.py
import time
import logging
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Mosque
from .serializers import MosqueSerializer
from .utils import get_grid, haversine  # Importing functions from utils.py

logger = logging.getLogger(__name__)




AVERAGE_DRIVING_SPEED_MPH = 45  
DRIVING_TIME_MINUTES = 30  
DRIVING_DISTANCE_MILES = (AVERAGE_DRIVING_SPEED_MPH / 60) * DRIVING_TIME_MINUTES  
KM_TO_MILES = 0.621371  

class NearbyMosquesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = float(request.query_params.get('lat'))
        lon = float(request.query_params.get('lon'))
        distance_miles = DRIVING_DISTANCE_MILES  #max mosque distance is within a 30 minute drive

        logger.info(f"User {request.user} requesting nearby mosques for lat: {lat}, lon: {lon}, distance: {distance_miles} miles")

        # Convert driving distance in miles to kilometers 
        distance_km = distance_miles / KM_TO_MILES

        grid_lat, grid_lon = get_grid(lat, lon)
        radius_in_degrees = distance_km / 111  # Convert distance to degrees
        grid_radius = int(radius_in_degrees / GRID_SIZE) + 1

        start_time = time.time()

        # Query to get nearby grids
        nearby_grids_query = Q()
        for dx in range(-grid_radius, grid_radius + 1):
            for dy in range(-grid_radius, grid_radius + 1):
                nearby_grids_query |= Q(grid_cell_lat=grid_lat + dx, grid_cell_lon=grid_lon + dy)

        # Fetching mosques in the nearby grids
        nearby_mosques = Mosque.objects.filter(nearby_grids_query).only('mosque_id', 'lat', 'lon')

        # Filter mosques by actual distance and sort by closest distance
        mosques = []
        for mosque in nearby_mosques:
            distance_to_mosque_km = haversine(lat, lon, mosque.lat, mosque.lon)
            distance_to_mosque_miles = distance_to_mosque_km * KM_TO_MILES
            if distance_to_mosque_miles <= distance_miles:
                mosques.append({
                    'id': mosque.mosque_id,
                    'distance_miles': f"{distance_to_mosque_miles:.2f}"
                })

        # Sort mosques by distance_miles
        mosques.sort(key=lambda x: x['distance_miles'])

        total_time = time.time() - start_time
        logger.info(f"Nearby mosques fetched in {total_time:.2f} seconds")

        return Response(mosques, status=status.HTTP_200_OK)


class MosqueVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} attempting to verify mosque")
        # Add your verification logic here
        return Response({'status': 'Mosque verification logic not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class GetUsersView(ListAPIView):
    """
    View to list all users or filter users by mosquename.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CustomUser.objects.all()
        mosquename = self.request.query_params.get('mosquename', None)
        if mosquename is not None:
            queryset = queryset.filter(mosque__mosquename=mosquename)
        return queryset

class GetUserDetailView(RetrieveAPIView):
    """
    View to retrieve a user by ID.
    """
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

class GetPostsView(ListAPIView):
    """
    View to list all posts or filter posts by mosquename.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Post.objects.all()
        mosquename = self.request.query_params.get('mosquename', None)
        if mosquename is not None:
            queryset = queryset.filter(mosque__mosquename=mosquename)
        return queryset

class GetPostDetailView(RetrieveAPIView):
    """
    View to retrieve a post by ID.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]


class UserProfileView(APIView):
    """
    View to retrieve a mosque's profile along with their posts and events.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mosque_id = request.query_params.get('mosque_id')
        mosquename = request.query_params.get('mosquename')
        
        try:
            if mosque_id:
                mosque = get_object_or_404(Mosque, mosque_id=mosque_id)
            elif mosquename:
                mosque = get_object_or_404(Mosque, mosquename=mosquename)
            else:
                user = request.user
                if user.role != 'mosque':
                    return Response({'error': 'Profile not available'}, status=status.HTTP_403_FORBIDDEN)
                mosque = user.mosque
        except Mosque.DoesNotExist:
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MosqueSerializer(mosque)
        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .serializers import CustomUserSerializer
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if username is None or password is None:
            return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Authenticating user with username: {username}")

        user = authenticate(request, username=username, password=password)
        logger.info(f"Authentication result for {username}: {user}")

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': CustomUserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            logger.error(f"Authentication failed for user: {username}")
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)



class NearbyEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = float(request.query_params.get('lat'))
        lon = float(request.query_params.get('lon'))

        logger.info(f"User {request.user} requesting nearby events for lat: {lat}, lon: {lon}")

        # Call the existing nearby mosques view to get nearby mosques
        nearby_mosques_view = NearbyMosquesView()
        mosques_response = nearby_mosques_view.get(request).data

        # Extract mosque IDs from the response
        mosque_ids = [mosque['id'] for mosque in mosques_response]

        # Fetch events for the nearby mosques
        events = Events.objects.filter(mosque_id__in=mosque_ids).order_by('event_date')

        events_list = []
        for event in events:
            events_list.append({
                'mosque_id': event.mosque_id,
                'event_title': event.event_title,
                'event_date': event.event_date,
                'location': event.location,
                'event_description': event.event_description,
                'rsvp': event.rsvp
            })

        logger.info(f"Nearby events fetched successfully")

        return Response(events_list, status=status.HTTP_200_OK)
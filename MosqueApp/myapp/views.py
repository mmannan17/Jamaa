from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Mosque, Post, Follow, Organization
from .serializers import CustomUserSerializer, MosqueSerializer, PostEventForm, PostSerializer,FollowSerializer, OrganizationSerializer
from django.contrib.auth.models import Permission
from .updatelocation import get_location
from django.db import transaction
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
import boto3
import json
import os
from dotenv import load_dotenv
# import openai
import pytesseract
from PIL import Image
import base64
import io
from openpyxl import Workbook
import pandas as pd
from datetime import datetime  
import requests

# from openai import OpenAI
load_dotenv()
# OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
# client = OpenAI(api_key=OPENAI_API_KEY)
pytesseract_path = os.getenv('PYTESSERACT_PATH')
pytesseract.pytesseract.tesseract_cmd = pytesseract_path

def index(request):
    return HttpResponse("Welcome to the Mosque App")


CACHE_TTL = getattr(settings, 'CACHE_TTL', DEFAULT_TIMEOUT)



SHARED_PERMISSION_CODES = [
    'can_post_announcements',
    'can_put_up_events',
    'can_post_media'
]

class RegisterUserView(APIView):
    def post(self, request):
        logger.info("Starting user registration")

        serializer = CustomUserSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        role = validated_data['role']
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']

        try:
            with transaction.atomic():
                logger.info(f"Registering role: {role}")

                # Get permissions
                shared_perms = Permission.objects.filter(codename__in=SHARED_PERMISSION_CODES)
                if shared_perms.count() != len(SHARED_PERMISSION_CODES):
                    logger.error("Missing or duplicate shared permissions")
                    return Response({"error": "One or more permissions are missing or duplicated."},
                                    status=status.HTTP_400_BAD_REQUEST)

                if role == 'mosque' or role == 'organization':
                    address = request.data.get('address')
                    lat, lon = get_location(address)
                    if lat is None or lon is None:
                        return Response({'error': 'Invalid address'}, status=status.HTTP_400_BAD_REQUEST)
                    grid_lat, grid_lon = get_grid(lat, lon)

                user = CustomUser.objects.create(
                    username=username,
                    email=email,
                    role=role,
                    latitude=lat if role != 'user' else request.data.get('latitude'),
                    longitude=lon if role != 'user' else request.data.get('longitude'),
                    grid_cell_lat=grid_lat if role != 'user' else get_grid(float(request.data.get('latitude')), float(request.data.get('longitude')))[0],
                    grid_cell_lon=grid_lon if role != 'user' else get_grid(float(request.data.get('latitude')), float(request.data.get('longitude')))[1],
                )
                user.set_password(password)
                user.save()

                # Assign shared permissions
                user.user_permissions.set(shared_perms)

                # Exclusive permission for mosque
                if role == 'mosque':
                    extra_perm = Permission.objects.get(codename='can_change_prayer_times')
                    user.user_permissions.add(extra_perm)

                    Mosque.objects.create(
                        user=user,
                        email=email,
                        mosquename=username,
                        address=address,
                        lat=lat,
                        lon=lon,
                        grid_cell_lat=grid_lat,
                        grid_cell_lon=grid_lon,
                    )

                elif role == 'organization':
                    Organization.objects.create(
                        user=user,
                        organization_name=username,
                        email=email,
                        address=address,
                        latitude=lat,
                        longitude=lon,
                        grid_cell_lat=grid_lat,
                        grid_cell_lon=grid_lon,
                    )

                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': serializer.data
                }, status=status.HTTP_201_CREATED)

        except Permission.DoesNotExist as e:
            logger.error(f"Missing permission: {str(e)}")
            return Response({'error': 'A required permission is missing.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.exception("Unexpected error during registration")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
        
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type')

        s3_client = boto3.client('s3', region_name=settings.AWS_S3_REGION_NAME,
                                 aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                 aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
       
        try:
            # Generate pre-signed URL for direct upload to S3
            presigned_url = s3_client.generate_presigned_url('put_object',
                                                             Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                                                                     'Key': f"media/{file_name}",
                                                                     'ContentType': file_type},
                                                             ExpiresIn=3600)  # URL expires in 1 hour
            return Response({'url': presigned_url, 'file_name': file_name}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error generating pre-signed URL: {e}")
            return Response({'error': 'Failed to generate upload URL'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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



import time
import logging
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Mosque
from .serializers import MosqueSerializer
from .utils import get_grid, haversine  

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
        distance_miles = DRIVING_DISTANCE_MILES  # max mosque distance is within a 30 minute drive or 20 miles subject to user preference
                                                 # can be increased or decreased in settings but for now its hard coded 
                                                 #later can be changed into a variable 

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
                    'mosque_id': mosque.mosque_id,
                    "mosquename":mosque.mosquename,
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
        # verification logic here 
        # currently working on ways to verify mosques
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


class GetMosqueDetailView(RetrieveAPIView):
    """
    View to retrieve a mosque by ID or name.
    """
    queryset = Mosque.objects.all()
    serializer_class = MosqueSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Get the value from URL parameters
        lookup_value = self.kwargs.get('lookup_value')

        # Try to get the mosque by ID or by name
        if lookup_value.isdigit():
            # If it's a digit, assume it's an ID
            return get_object_or_404(Mosque, pk=lookup_value)
        else:
            # Otherwise, assume it's a name
            return get_object_or_404(Mosque, name=lookup_value)

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

        # Get nearby mosques and organizations
        nearby_mosques_view = NearbyMosquesView()
        mosques_response = nearby_mosques_view.get(request).data
        mosque_ids = [mosque['mosque_id'] for mosque in mosques_response]

        # Fetch events from both mosques and organizations
        events = Events.objects.filter(
            Q(mosque_id__in=mosque_ids) | Q(organization__isnull=False)
        ).order_by('event_date')

        events_list = []
        for event in events:
            event_data = {
                'event_title': event.event_title,
                'event_date': event.event_date,
                'location': event.location,
                'event_description': event.event_description,
                'rsvp': event.rsvp
            }
            if event.mosque:
                event_data['mosque_id'] = event.mosque.mosque_id
                event_data['type'] = 'mosque'
            else:
                event_data['organization_id'] = event.organization.organization_id
                event_data['type'] = 'organization'
            
            events_list.append(event_data)

        return Response(events_list, status=status.HTTP_200_OK)
    


class DeletePostsView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check ownership based on post type
        if post.mosque:
            if request.user != post.mosque.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif post.organization:
            if request.user != post.organization.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        post.delete()
        return Response({'status': 'Post deleted successfully'}, status=status.HTTP_200_OK)
    


class SavePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        # Determine if this is a mosque or organization post
        if user.role == 'mosque':
            try:
                mosque = user.mosque
                post_data = {
                    'mosque': mosque.mosque_id,
                    'organization': None,
                    'title': data.get('title', ''),
                    'posttype': data.get('posttype', ''),
                    'content': data.get('content', ''),
                    'media_file': data.get('media_url', ''),
                    'media_type': data.get('media_type', ''),
                }
            except Mosque.DoesNotExist:
                return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)
        elif user.role == 'organization':
            try:
                organization = user.organization
                post_data = {
                    'mosque': None,
                    'organization': organization.organization_id,
                    'title': data.get('title', ''),
                    'posttype': data.get('posttype', ''),
                    'content': data.get('content', ''),
                    'media_file': data.get('media_url', ''),
                    'media_type': data.get('media_type', ''),
                }
            except Organization.DoesNotExist:
                return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PostSerializer(data=post_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class EditPostView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id):
        logger.info(f"User {request.user} attempting to edit post id: {post_id}")
        
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            logger.error(f"Post with id {post_id} not found")
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the requesting user is the mosque user or has the appropriate role
        if request.user != post.mosque.user and request.user.role != 'mosque':
            logger.error(f"User {request.user} does not have permission to edit post {post_id}")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Post {post_id} edited by user {request.user}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"Edit post failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  
    
class EditProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        logger.info(f"User {request.user} attempting to edit profile")
        
        try:
            user = request.user
            user.username = request.data.get('username', user.username)
            user.email = request.data.get('email', user.email)
            user.mosquename = request.data.get('mosquename', user.mosquename)
            user.address = request.data.get('address', user.address)
            user.latitude = request.data.get('latitude', user.latitude)
            user.longitude = request.data.get('longitude', user.longitude)
            user.prayer_times = request.data.get('prayer_times', user.prayer_times)
            user.save()
            logger.info(f"Profile updated for user {user}")
            return Response({'status': 'Profile updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Profile update failed: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class EditMosqueView(APIView):
    permission_classes = [IsAuthenticated] 

    def put(self, request):
        logger.info(f"User {request.user} attempting to edit mosque")

        try:
            mosque = request.user.mosque
        except Mosque.DoesNotExist:
            logger.error(f"Mosque for user {request.user} not found")
            return Response({'error': 'Mosque not found'}, status=status.HTTP_404_NOT_FOUND)

        mosque.mosquename = request.data.get('mosquename', mosque.mosquename)
        mosque.email = request.data.get('email', mosque.email)
        mosque.description = request.data.get('description', mosque.description)
        mosque.profile_pic = request.data.get('profile_pic', mosque.profile_pic)
        mosque.prayer_times = request.data.get('prayer_times', mosque.prayer_times)
        mosque.address = request.data.get('address', mosque.address)
        mosque.lat = request.data.get('lat', mosque.lat)
        mosque.lon = request.data.get('lon', mosque.lon)
        mosque.grid_cell_lat = request.data.get('grid_cell_lat', mosque.grid_cell_lat)
        mosque.grid_cell_lon = request.data.get('grid_cell_lon', mosque.grid_cell_lon)

        try:
            mosque.save()
            logger.info(f"Mosque profile updated for user {request.user}")
            return Response({'status': 'Mosque profile updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Mosque profile update failed: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    



class DeleteEventView(APIView):
    permission_classes=[IsAuthenticated]

    def delete(self,request,event_id):
        logger.info(f"User {request.user} attempting to delete event id: {event_id}")
    
        try:
            event=Events.object.get(event_id=event_id)
        except Events.DoesNotExist:
            return Response({'error':'Event not found'},status=status.HTTP_404_NOT_FOUND)
        
        # The mosque associated with the event
        mosque=event.mosque

        # The user associated with the mosque
        mosque_user=mosque.user

        # Check if the requesting user is the mosque user or has the appropriate role
        if request.user != mosque_user and request.user.role != 'mosque':
            logger.error(f"User {request.user} does not have permission to delete event {event_id}")
            return Response({'error':'Permission denied'},status=status.HTTP_403_FORBIDDEN)
        
        event.delete()
        logger.info(f"Event {event_id} deleted by user {request.user}")
        return Response({'status':'Event deleted successfully'},status=status.HTTP_200_OK)
    


        




logger = logging.getLogger(__name__)

class DisplayFollowing(APIView):
    def get(self, request, user_id):
        try:
           
            following_list = Follow.objects.filter(user_id=user_id) 

            
            if not following_list.exists():
                return Response({'error': 'No following found for this user.'}, status=status.HTTP_404_NOT_FOUND)

            
            mosques = [follow.mosque.mosque_id for follow in following_list]  
            

            return Response({"mosque_ids": mosques}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)




class DisplayPrayers(APIView):
    def get(self, request, mosque_id):
        # Get the current date formatted as yyyy-mm-dd
        formatted_date = datetime.datetime.now().strftime("%Y-%m-%d")

        try:
            # Retrieve the mosque instance
            mosque = Mosque.objects.get(mosque_id=mosque_id)  
            
            # Access the prayer_times field directly
            prayer_times = mosque.prayer_times  # Assuming this is a dictionary
            
            # Debugging: Print the prayer_times to see its structure
            print("Prayer Times:", prayer_times)  # This will show in your server logs
            print("formatteddate:",formatted_date)
            # Check if the formatted date exists in the prayer times
            if formatted_date in prayer_times:
                return Response(prayer_times[formatted_date], status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Prayer times not found for today.'}, status=status.HTTP_404_NOT_FOUND)
        
        except Mosque.DoesNotExist:
            return Response({'error': 'Mosque not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        



class EditPrayerTime(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, mosque_id):
        logger.info(f"User {request.user} attempting to edit prayer times for mosque {mosque_id}")

        try:
            mosque = Mosque.objects.get(mosque_id=mosque_id)
        except Mosque.DoesNotExist:
            return Response({'error': 'Mosque not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get the date and prayer times from the request data
        date = request.data.get('date')
        new_prayer_times = request.data.get('prayer_times')

        if not date or not new_prayer_times:
            return Response({'error': 'Date and prayer times are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate date format
        try:
            datetime.datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update the prayer times for the specified date
        prayer_times = mosque.prayer_times or {}
        existing_times = prayer_times.get(date, {})
        
        # Merge existing times with new times
        updated_times = {**existing_times, **new_prayer_times}
        prayer_times[date] = updated_times
        mosque.prayer_times = prayer_times
        mosque.save()

        logger.info(f"Prayer times for {date} updated for mosque {mosque_id}")
        return Response({'status': f'Prayer times for {date} updated successfully'}, status=status.HTTP_200_OK)






class OrganizationProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization_id = request.query_params.get('organization_id')
        organization_name = request.query_params.get('organization_name')
        
        try:
            if organization_id:
                organization = get_object_or_404(Organization, organization_id=organization_id)
            elif organization_name:
                organization = get_object_or_404(Organization, organization_name=organization_name)
            else:
                user = request.user
                if user.role != 'organization':
                    return Response({'error': 'Profile not available'}, status=status.HTTP_403_FORBIDDEN)
                organization = user.organization
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        if request.user.role != 'organization':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            organization = request.user.organization
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrganizationSerializer(organization, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






class TagOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, organization_id):
        """
        Tag an organization with the requesting mosque
        """
        logger.info(f"Mosque {request.user} attempting to tag organization {organization_id}")
        
        # Check if the user is a mosque
        if request.user.role != 'mosque':
            logger.error(f"User {request.user} is not a mosque")
            return Response({'error': 'Only mosques can tag organizations'}, 
                          status=status.HTTP_403_FORBIDDEN)

        try:
            # Get the organization
            organization = Organization.objects.get(organization_id=organization_id)
            
            # Get the mosque
            mosque = request.user.mosque
            
            # Add the tag
            organization.tagged_by.add(mosque)
            
            logger.info(f"Organization {organization_id} tagged by mosque {mosque.mosque_id}")
            return Response({
                'status': 'Organization tagged successfully',
                'organization_id': organization_id,
                'mosque_id': mosque.mosque_id
            }, status=status.HTTP_200_OK)
            
        except Organization.DoesNotExist:
            logger.error(f"Organization {organization_id} not found")
            return Response({'error': 'Organization not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Mosque.DoesNotExist:
            logger.error(f"Mosque not found for user {request.user}")
            return Response({'error': 'Mosque not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, organization_id):
        """
        Remove a tag from an organization
        """
        logger.info(f"Mosque {request.user} attempting to untag organization {organization_id}")
        
        # Check if the user is a mosque
        if request.user.role != 'mosque':
            logger.error(f"User {request.user} is not a mosque")
            return Response({'error': 'Only mosques can untag organizations'}, 
                          status=status.HTTP_403_FORBIDDEN)

        try:
            # Get the organization
            organization = Organization.objects.get(organization_id=organization_id)
            
            # Get the mosque
            mosque = request.user.mosque
            
            # Remove the tag
            organization.tagged_by.remove(mosque)
            
            logger.info(f"Organization {organization_id} untagged by mosque {mosque.mosque_id}")
            return Response({
                'status': 'Organization untagged successfully',
                'organization_id': organization_id,
                'mosque_id': mosque.mosque_id
            }, status=status.HTTP_200_OK)
            
        except Organization.DoesNotExist:
            logger.error(f"Organization {organization_id} not found")
            return Response({'error': 'Organization not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Mosque.DoesNotExist:
            logger.error(f"Mosque not found for user {request.user}")
            return Response({'error': 'Mosque not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

    def get(self, request, organization_id=None):
        """
        Get all organizations tagged by a mosque or all mosques that tagged an organization
        """
        if organization_id:
            # Get all mosques that tagged a specific organization
            try:
                organization = Organization.objects.get(organization_id=organization_id)
                tagged_by = organization.tagged_by.all()
                return Response({
                    'organization_id': organization_id,
                    'tagged_by': [{
                        'mosque_id': mosque.mosque_id,
                        'mosque_name': mosque.mosquename
                    } for mosque in tagged_by]
                }, status=status.HTTP_200_OK)
            except Organization.DoesNotExist:
                return Response({'error': 'Organization not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        else:
            # Get all organizations tagged by the requesting mosque
            if request.user.role != 'mosque':
                return Response({'error': 'Only mosques can view their tagged organizations'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            try:
                mosque = request.user.mosque
                tagged_organizations = mosque.tagged_organizations.all()
                return Response({
                    'mosque_id': mosque.mosque_id,
                    'tagged_organizations': [{
                        'organization_id': org.organization_id,
                        'organization_name': org.organization_name
                    } for org in tagged_organizations]
                }, status=status.HTTP_200_OK)
            except Mosque.DoesNotExist:
                return Response({'error': 'Mosque not found'}, 
                              status=status.HTTP_404_NOT_FOUND)


class UserPrayerTimes(APIView):
    permission_classes = [IsAuthenticated]
    
    date = datetime.now().strftime("%d-%m-%Y")
    
    def get(self, request):
        user = request.user
        if user.role == 'user':
            if not user.latitude or not user.longitude:
                return Response({'error': 'User location not set'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Format the URL with the correct date format  ## fix this 
                url = f'https://api.aladhan.com/v1/timingsByCity/{self.date}?city=Tampa&country=US&method=2'
                logger.info(f"Calling API URL: {url}")
                
                response = requests.get(url)
                
                if response.status_code != 200:
                    logger.error(f"API Error: {response.text}")
                    return Response({'error': 'Failed to fetch prayer times'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                data = response.json()
                
                if 'data' not in data or 'timings' not in data['data']:
                    logger.error(f"Invalid response structure: {data}")
                    return Response({'error': 'Invalid response from prayer times API'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                prayer_times = data['data']['timings']
                
                # Convert each prayer time to 12-hour format using datetime
                converted_times = {}
                for prayer, time_str in prayer_times.items():
                    try:
                        time_obj = datetime.strptime(time_str, "%H:%M")
                        converted_times[prayer] = time_obj.strftime("%I:%M %p")
                    except ValueError:
                        converted_times[prayer] = time_str
                
                return Response({'prayer_times': converted_times}, status=status.HTTP_200_OK)
                
            except requests.RequestException as e:
                logger.error(f"Error fetching prayer times: {str(e)}")
                return Response({'error': 'Failed to fetch prayer times'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                return Response({'error': str(e)}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
            

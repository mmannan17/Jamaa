from django.urls import path
from .views import (
    RegisterUserView, UpdateMosqueView, FollowMosqueView,
    PostAnnouncementView, PostMediaView, PostEventView, LikePostView, NearbyMosquesView,MosqueVerificationView,GetUsersView, GetUserDetailView,
    GetPostsView, GetPostDetailView,UserProfileView,UserLoginView,NearbyEventsView
)

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('mosque/<int:mosque_id>/update/', UpdateMosqueView.as_view(), name='update_mosque'),
    path('mosque/<int:mosque_id>/follow/', FollowMosqueView.as_view(), name='follow_mosque'),
    path('post/announcement/', PostAnnouncementView.as_view(), name='post_announcement'),
    path('post/media/', PostMediaView.as_view(), name='post_media'),
    path('post/event/', PostEventView.as_view(), name='post_event'),
    path('post/<int:post_id>/like/', LikePostView.as_view(), name='like_post'),
    path('nearby_mosques/', NearbyMosquesView.as_view(), name='nearby_mosques'),
    path('mosque_verification/',MosqueVerificationView.as_view(), name='mosque_verification'),
    path('mosques/', GetUsersView.as_view(), name='get_mosques'),
    path('mosques/<int:pk>/', GetUserDetailView.as_view(), name='get_mosques_detail'),
    path('posts/', GetPostsView.as_view(), name='get_posts'),
    path('posts/<int:pk>/', GetPostDetailView.as_view(), name='get_post_detail'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/<int:user_id>/', UserProfileView.as_view(), name='user_profile_detail'),
    path('login/',UserLoginView.as_view(), name='login'),
    path('events/', NearbyEventsView.as_view(), name='nearby_events'),


]

from django.urls import path
from .views import (
    RegisterUserView, UpdateMosqueView, FollowMosqueView,
    PostAnnouncementView, PostMediaView, PostEventView, LikePostView, NearbyMosquesView,MosqueVerificationView,GetUsersView, GetUserDetailView,
    GetPostsView, GetPostDetailView,UserProfileView,UserLoginView,NearbyEventsView,DeletePostsView,SavePostView,GetMosqueDetailView,PrayerTimeUploadView,DeleteEventView,EditMosqueView,
    DisplayFollowing,DisplayPrayers,EditPostView,EditPrayerTime,AddProfilePicture
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
    path('mosques/', GetUsersView.as_view(), name='get_user'),
    path('mosques/<int:pk>/', GetUserDetailView.as_view(), name='get_user_detail'),
    path('posts/', GetPostsView.as_view(), name='get_posts'),
    path('posts/<int:pk>/', GetPostDetailView.as_view(), name='get_post_detail'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/<int:user_id>/', UserProfileView.as_view(), name='user_profile_detail'),
    path('login/',UserLoginView.as_view(), name='login'),
    path('events/', NearbyEventsView.as_view(), name='nearby_events'),
    path('posts/<int:post_id>/delete/', DeletePostsView.as_view(), name='delete-post'),
    path('post/save/', SavePostView.as_view(), name='save_post'),
    path('getmosque/<str:lookup_value>/',GetMosqueDetailView.as_view(), name='get_mosque'),
    path('upload_prayer_times/',PrayerTimeUploadView.as_view(), name='upload_prayer_times'),
    path('delete_event/<int:event_id>/',DeleteEventView.as_view(), name='delete_event'),
    path('edit_mosque/',EditMosqueView.as_view(), name='edit_mosque'),
    path('user/<int:user_id>/following/',DisplayFollowing.as_view(), name='display_following'),
    path('display/<int:mosque_id>/prayertimes/',DisplayPrayers.as_view(), name='display_prayertimes'),
    path('edit_post/<int:post_id>/',EditPostView.as_view(), name='editpost'),
    path('edit_prayer_time/<int:mosque_id>/',EditPrayerTime.as_view(), name='edit_prayer_time'),
    path('upload_profile_pic/',AddProfilePicture.as_view(), name='upload_profile_pic')

]

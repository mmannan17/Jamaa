from django.urls import path
from .views import (
    RegisterUserView, UpdateMosqueView, FollowMosqueView,
    PostAnnouncementView, PostMediaView, PostEventView, LikePostView
)

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('mosque/<int:mosque_id>/update/', UpdateMosqueView.as_view(), name='update_mosque'),
    path('mosque/<int:mosque_id>/follow/', FollowMosqueView.as_view(), name='follow_mosque'),
    path('post/announcement/', PostAnnouncementView.as_view(), name='post_announcement'),
    path('post/media/', PostMediaView.as_view(), name='post_media'),
    path('post/event/', PostEventView.as_view(), name='post_event'),
    path('post/<int:post_id>/like/', LikePostView.as_view(), name='like_post'),
]

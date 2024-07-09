from django.contrib import admin
from django.urls import path, include
from myapp.views import index  # Ensure this matches the actual app name
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('MosqueApp/', include('myapp.urls')),  # Ensure 'myapp' matches the actual name of your app
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]


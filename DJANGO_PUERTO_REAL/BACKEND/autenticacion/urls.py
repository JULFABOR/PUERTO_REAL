from django.urls import path
from .api_views import CustomAuthToken

urlpatterns = [
    # URLs de API
    path('api/login/', CustomAuthToken.as_view(), name='api_login'),
    ]


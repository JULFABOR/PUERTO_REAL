from django.urls import path
from .api_views import CustomAuthToken, LogoutView, RequestPasswordResetView, PasswordResetConfirmView, RegisterView, UserDataView

urlpatterns = [
    # URLs de API
    path('api/login/', CustomAuthToken.as_view(), name='api_login'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),
    path('api/register/', RegisterView.as_view(), name='api_register'),
    path('api/user/me/', UserDataView.as_view(), name='user-me'),

    # URLs para el reseteo de contraseña
    path('api/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('api/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
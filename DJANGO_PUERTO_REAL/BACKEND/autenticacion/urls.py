from django.urls import path
from .api_views import CustomAuthToken, LogoutView, RequestPasswordResetView, PasswordResetConfirmView, RegisterView, UserDataView, UsersAdminView

urlpatterns = [
    # URLs de API (¡Sin el prefijo 'api/'!)
        path('login/', CustomAuthToken.as_view(), name='api_login'),
        path('logout/', LogoutView.as_view(), name='api_logout'),
        path('register/', RegisterView.as_view(), name='api_register'),
        path('user/me/', UserDataView.as_view(), name='user-me'),
            path('users/', UsersAdminView.as_view(), name='users-list-create'),
            path('users/<int:pk>/', UsersAdminView.as_view(), name='users-delete'),

        # URLs para el reseteo de contraseña (¡Sin el prefijo 'api/'!)
        path('password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
        path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    ]
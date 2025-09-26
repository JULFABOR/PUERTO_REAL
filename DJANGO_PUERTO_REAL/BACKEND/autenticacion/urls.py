from django.urls import path
# --> CAMBIO 1: Importaremos las nuevas vistas que crearemos
from .api_views import CustomAuthToken, LogoutView, RequestPasswordResetView, PasswordResetConfirmView

urlpatterns = [
    # URLs de API
    path('api/login/', CustomAuthToken.as_view(), name='api_login'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),

    # --> CAMBIO 2: Añadimos las nuevas URLs para el reseteo de contraseña
    path('api/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('api/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
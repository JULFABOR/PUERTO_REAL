from django.urls import path
from .views import (
    CustomRegisterView,
    EmpleadoRegisterView,
    CustomLoginView,
    user_logout,
    ForgotPasswordView,
    ClienteRegisterByEmpleadoView
)

urlpatterns = [
    # URLs de Registro
    path('register/', CustomRegisterView.as_view(), name='register'),
    path('register/empleado/', EmpleadoRegisterView.as_view(), name='register_empleado'),
    path('register/cliente/', ClienteRegisterByEmpleadoView.as_view(), name='register_cliente_by_empleado'),

    # URLs de Login / Logout
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', user_logout, name='logout'),
    path('password-reset/', ForgotPasswordView.as_view(), name='password_reset'),
]

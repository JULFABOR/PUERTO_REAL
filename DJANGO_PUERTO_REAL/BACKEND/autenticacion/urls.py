from django.urls import path
from .views import (
    ClienteRegisterView,
    EmpleadoClienteRegisterView,
    EmpleadoRegisterView,
    CustomLoginView,
    user_logout
)

urlpatterns = [
    # URLs de Registro
    path('register/cliente/', ClienteRegisterView.as_view(), name='register_cliente'),
    path('register/cliente-por-empleado/', EmpleadoClienteRegisterView.as_view(), name='register_cliente_por_empleado'),
    path('register/empleado/', EmpleadoRegisterView.as_view(), name='register_empleado'),

    # URLs de Login / Logout
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', user_logout, name='logout'),
]

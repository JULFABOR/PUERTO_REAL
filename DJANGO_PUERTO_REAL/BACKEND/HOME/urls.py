from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'home'

router = DefaultRouter()
router.register(r'estados', views.EstadoViewSet, basename='estado')

urlpatterns = [
    path("api/saludo/", views.api_saludo, name="api_saludo"),
    path("api/empleados/", views.EmpleadoList.as_view(), name="empleado-list"),
    path('api/', include(router.urls)),
]

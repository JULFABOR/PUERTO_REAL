from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Importa SOLO las vistas que pertenecen a Ventas
from .views import (
    VentaViewSet, 
    VentasDashboardView,
    VentaView
)


app_name = 'ventas'

# Router para la API
router = DefaultRouter()
router.register(r'ventas', VentaViewSet)

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('pos/', VentaView.as_view(), name='pos'),
    path('venta/', VentaView.as_view(), name='venta'),
    path('dashboard/', VentasDashboardView.as_view(), name='ventas_dashboard'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)), 
]
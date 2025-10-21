from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ( 
    # 1. Solo importa las vistas de API
    HistorialPuntosViewSet, 
    ClientesViewSet, 
    load_points_qr
)

# Router para la API
router = DefaultRouter()
router.register(r'historial-puntos', HistorialPuntosViewSet)
router.register(r'clientes', ClientesViewSet)

# 2. Tu lista 'urlpatterns' ahora solo contiene las rutas de la API
urlpatterns = [
    # Las rutas del router (ej: /api/fidelizar/clientes/)
    path('', include(router.urls)), 
    
    # La ruta de tu api_view
    path('load_points_qr/', load_points_qr, name='load_points_qr'),
]
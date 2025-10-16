from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (  
    HistorialPuntosViewSet, ClientesViewSet, load_points_qr,
    FidelizacionDashboardView,
    ClientePerfilView,
    ClienteListView
)

app_name = 'fidelizacion'

# Router para la API
router = DefaultRouter()
router.register(r'historial-puntos', HistorialPuntosViewSet, basename='historial-puntos')
router.register(r'clientes', ClientesViewSet, basename='cliente')

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('dashboard/', FidelizacionDashboardView.as_view(), name='fidelizacion_dashboard'),
    path('cliente/<int:cliente_id>/', ClientePerfilView.as_view(), name='cliente_perfil'),
    path('clientes/', ClienteListView.as_view(), name='cliente_lista'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)),
    path('load_points_qr/', load_points_qr, name='load_points_qr'),
]

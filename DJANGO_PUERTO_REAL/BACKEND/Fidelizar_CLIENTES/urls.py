from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CuponesDescuentoViewSet,
    PromosClientesViewSet,
    HistorialPuntosViewSet, 
    ClientesViewSet, 
    load_points_qr,
    FidelizacionDashboardView,
    ClientePerfilView,
    ClienteListView,
)


app_name = 'fidelizacion'

# Router para la API
router = DefaultRouter()
router.register(r'cupones-descuento', CuponesDescuentoViewSet, basename='cupones-descuento')
router.register(r'promos-clientes', PromosClientesViewSet, basename='promos-clientes')
router.register(r'historial-puntos', HistorialPuntosViewSet, basename='historial-puntos')
router.register(r'clientes', ClientesViewSet, basename='cliente')

# URLs para las páginas web (plantillas de Django)
# Estas URLs son para la renderización del lado del servidor y pueden no ser necesarias
# si el frontend es una SPA (Single Page Application) que consume la API.
urlpatterns = [
    path('dashboard/', FidelizacionDashboardView.as_view(), name='fidelizacion_dashboard'),
    path('cliente/<int:cliente_id>/', ClientePerfilView.as_view(), name='cliente_perfil'),
    path('clientes/', ClienteListView.as_view(), name='cliente_lista'),
]

# URLs para la API
# Se recomienda que el archivo urls.py principal del proyecto incluya este
# router bajo un prefijo como /api/fidelizacion/
api_urlpatterns = [
    path('', include(router.urls)),
    path('load_points_qr/', load_points_qr, name='load_points_qr'),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConfiguracionFidelizacionViewSet, 
    CuponesDescuentoViewSet, 
    CuponesClientesViewSet, 
    HistorialPuntosViewSet, 
    ClientesViewSet, 
    load_points_qr,
    FidelizacionDashboardView
)

# Router para la API
router = DefaultRouter()
router.register(r'configuracion-fidelizacion', ConfiguracionFidelizacionViewSet, basename='configuracion-fidelizacion')
router.register(r'cupones-descuento', CuponesDescuentoViewSet)
router.register(r'cupones-clientes', CuponesClientesViewSet)
router.register(r'historial-puntos', HistorialPuntosViewSet)
router.register(r'clientes', ClientesViewSet)

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('dashboard/', FidelizacionDashboardView.as_view(), name='fidelizacion_dashboard'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)),
    path('load_points_qr/', load_points_qr, name='load_points_qr'),
]

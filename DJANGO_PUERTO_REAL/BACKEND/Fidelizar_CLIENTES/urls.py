from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConfiguracionFidelizacionViewSet, CuponesDescuentoViewSet, CuponesClientesViewSet, HistorialPuntosViewSet, ClientesViewSet, load_points_qr

router = DefaultRouter()
router.register(r'configuracion-fidelizacion', ConfiguracionFidelizacionViewSet, basename='configuracion-fidelizacion')
router.register(r'cupones-descuento', CuponesDescuentoViewSet)
router.register(r'cupones-clientes', CuponesClientesViewSet)
router.register(r'historial-puntos', HistorialPuntosViewSet)
router.register(r'clientes', ClientesViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('load_points_qr/', load_points_qr, name='load_points_qr'),
]

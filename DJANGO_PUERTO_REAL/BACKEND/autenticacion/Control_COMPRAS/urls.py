from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompraViewSet, ProveedorViewSet, ProveedorListView

# Router para la API
router = DefaultRouter()
router.register(r'compras', CompraViewSet)
router.register(r'proveedores', ProveedorViewSet)

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('proveedores/', ProveedorListView.as_view(), name='proveedor_list'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)),
]
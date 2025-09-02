from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompraViewSet, ProveedorViewSet

router = DefaultRouter()
router.register(r'compras', CompraViewSet)
router.register(r'proveedores', ProveedorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
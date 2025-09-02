from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet

router = DefaultRouter()
router.register(r'ventas', VentaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

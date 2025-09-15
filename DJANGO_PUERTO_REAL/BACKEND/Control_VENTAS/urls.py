from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, VentasDashboardView

# Router para la API
router = DefaultRouter()
router.register(r'ventas', VentaViewSet)

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('pos/', VentasDashboardView.as_view(), name='pos'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)),
]
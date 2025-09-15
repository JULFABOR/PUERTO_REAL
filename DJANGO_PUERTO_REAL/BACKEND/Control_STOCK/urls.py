from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockListView, 
    StockDecrementAPIView, 
    StockAdjustmentAPIView, 
    ProductoViewSet,
    StockDashboardView
)

# --- URLs de Páginas Web ---
urlpatterns = [
    path('', StockDashboardView.as_view(), name='stock_dashboard'),
]


# --- URLs de API ---
router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto')

api_urlpatterns = [
    path('', include(router.urls)),
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/decrement/', StockDecrementAPIView.as_view(), name='stock-decrement'),
    path('stock/adjust/', StockAdjustmentAPIView.as_view(), name='stock-adjust'),
]
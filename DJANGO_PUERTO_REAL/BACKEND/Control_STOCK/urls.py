from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockListView, 
    StockDecrementAPIView, 
    StockAdjustmentAPIView, 
    ProductoViewSet,
    StockDashboardView,
    ControlStockView,
    CatalogoProductosView,
    ProductoCreateView,
    ProductoUpdateView,
    ProductoDeleteView
)

app_name = 'stock'

# --- URLs de Páginas Web ---
urlpatterns = [
    path('dashboard/', StockDashboardView.as_view(), name='stock_dashboard'),
    path('control/', ControlStockView.as_view(), name='control'),
    path('catalogo/', CatalogoProductosView.as_view(), name='catalogo'),
    path('producto/nuevo/', ProductoCreateView.as_view(), name='producto_create'),
    path('producto/<int:pk>/editar/', ProductoUpdateView.as_view(), name='producto_update'),
    path('producto/<int:pk>/eliminar/', ProductoDeleteView.as_view(), name='producto_delete'),
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
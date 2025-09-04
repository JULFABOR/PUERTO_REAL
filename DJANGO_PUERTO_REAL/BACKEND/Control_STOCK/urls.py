from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockListView, 
    StockDecrementAPIView, 
    StockAdjustmentAPIView, 
    ProductoListView, 
    ProductoCreateView, 
    ProductoUpdateView, 
    ProductoDeleteView,
    ProductoViewSet,
    StockDashboardView
)

# --- URLs de Páginas Web ---
urlpatterns = [
    path('dashboard/', StockDashboardView.as_view(), name='stock_dashboard'),
    # CRUD de Productos
    path('productos/', ProductoListView.as_view(), name='producto_list'),
    path('productos/nuevo/', ProductoCreateView.as_view(), name='producto_create'),
    path('productos/<int:pk>/editar/', ProductoUpdateView.as_view(), name='producto_update'),
    path('productos/<int:pk>/eliminar/', ProductoDeleteView.as_view(), name='producto_delete'),
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

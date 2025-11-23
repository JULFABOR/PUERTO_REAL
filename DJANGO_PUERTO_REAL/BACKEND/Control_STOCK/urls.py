from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Vistas de API
    ProductoViewSet, CategoriaProductoViewSet, EstadoProductoViewSet,
    StockListView, 
    StockDecrementAPIView, 
    StockAdjustmentAPIView, 
    StockAddAPIView,
    StockHistoryAPIView,
)

app_name = 'stock'

# --- 1. Definimos el Router de la API para esta aplicación ---
# Este router es local a este archivo y no entrará en conflicto con otros.
router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'categorias', CategoriaProductoViewSet, basename='categoria')
router.register(r'categorias-producto', CategoriaProductoViewSet, basename='categoria-producto')
router.register(r'estados-producto', EstadoProductoViewSet, basename='estado-producto')

# --- 2. Definimos las URLs de la API ---
# Combinamos las URLs generadas por el router con las vistas de API manuales.
api_urlpatterns = router.urls + [
    path('stock-list/', StockListView.as_view(), name='stock-list'),
    path('stock/decrement/', StockDecrementAPIView.as_view(), name='stock-decrement'),
    path('stock/adjust/', StockAdjustmentAPIView.as_view(), name='stock-adjust'),
    path('add-stock/', StockAddAPIView.as_view(), name='add-stock'),
    path("historial-producto/<int:id_producto>/", StockHistoryAPIView.as_view(), name="api_historial_producto"),
]
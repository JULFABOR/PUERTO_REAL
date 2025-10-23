from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Vistas de API
    ProductoViewSet, CategoriaProductoViewSet, EstadoProductoViewSet,
    StockListView, 
    StockDecrementAPIView, 
    StockAdjustmentAPIView, 
    StockAddAPIView,

    # Vistas de Páginas Web (Templates)
    # StockDashboardView,
    # ControlStockView,
    # CatalogoProductosView,
    # ProductoCreateView,
    # ProductoUpdateView,
    # ProductoDeleteView,
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
]

# --- 3. Definimos las URLs de las Páginas Web ---
# Estas son solo para las vistas que renderizan plantillas HTML.
urlpatterns = [
    # path('dashboard/', StockDashboardView.as_view(), name='stock_dashboard'),
    # path('control/', ControlStockView.as_view(), name='control'),
    # path('catalogo/', CatalogoProductosView.as_view(), name='catalogo'),
    # path('producto/nuevo/', ProductoCreateView.as_view(), name='producto_create'),
    # path('producto/<int:pk>/editar/', ProductoUpdateView.as_view(), name='producto_update'),
    # path('producto/<int:pk>/eliminar/', ProductoDeleteView.as_view(), name='producto_delete'),
]
from django.urls import path
from .views import StockListView, StockDecrementAPIView, StockAdjustmentAPIView, ProductoListView, ProductoCreateView, ProductoUpdateView, ProductoDeleteView

urlpatterns = [
    # URLs para el CRUD de Productos (Web)
    path('productos/', ProductoListView.as_view(), name='producto_list'),
    path('productos/nuevo/', ProductoCreateView.as_view(), name='producto_create'),
    path('productos/<int:pk>/editar/', ProductoUpdateView.as_view(), name='producto_update'),
    path('productos/<int:pk>/eliminar/', ProductoDeleteView.as_view(), name='producto_delete'),

    # URLs de la API (existentes)
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/decrement/', StockDecrementAPIView.as_view(), name='stock-decrement'),
    path('stock/adjust/', StockAdjustmentAPIView.as_view(), name='stock-adjust'),
]
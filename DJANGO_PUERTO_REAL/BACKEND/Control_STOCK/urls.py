from django.urls import path
from .views import StockListView, StockDecrementAPIView, StockAdjustmentAPIView

urlpatterns = [
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/decrement/', StockDecrementAPIView.as_view(), name='stock-decrement'),
    path('stock/adjust/', StockAdjustmentAPIView.as_view(), name='stock-adjust'),
]
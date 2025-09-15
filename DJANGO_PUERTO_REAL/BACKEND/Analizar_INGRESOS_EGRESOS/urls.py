from django.urls import path
from .views import AnalisisDashboardView

app_name = 'Analizar_INGRESOS_EGRESOS'

urlpatterns = [
    path('', AnalisisDashboardView.as_view(), name='analisis_dashboard'),
]

from django.urls import path
from .views import ConfiguracionTiendaView, ConfiguracionPuntosView

app_name = 'config_pr'

urlpatterns = [
    path('configuracion-tienda/', ConfiguracionTiendaView.as_view(), name='configuracion-tienda'),
    path('configuracion-puntos/', ConfiguracionPuntosView.as_view(), name='configuracion-puntos'),
]

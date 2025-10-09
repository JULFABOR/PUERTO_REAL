# urls.py
from django.urls import path
from .views import panel_caja, retiro_medio_turno, rendir_fondo
from .views import AbrirCajaAPIView, HistorialCajaListAPIView, RetiroAPIView, RendirFondoAPIView, CerrarCajaAPIView, CajaEstadoAPIView, MovimientoFondoAPIView, MovimientoFondoListAPIView

app_name = 'Abrir_Cerrar_CAJA'

web_urlpatterns = [
    # Regular Django Views
    path("", panel_caja, name="panel_caja"),
    path("retiro/", retiro_medio_turno, name="retiro_medio_turno"),
    path("rendir-fondo/", rendir_fondo, name="rendir_fondo"),
]

api_urlpatterns = [
    # API Views
    path("caja/abrir/", AbrirCajaAPIView.as_view(), name="api_abrir_caja"),
    path("caja/estado/", CajaEstadoAPIView.as_view(), name="api_caja_estado"),
    path("caja/retiro/", RetiroAPIView.as_view(), name="api_retiro_caja"),
    path("caja/rendir/", RendirFondoAPIView.as_view(), name="api_rendir_fondo"),
    path("caja/cerrar/", CerrarCajaAPIView.as_view(), name="api_cerrar_caja"),
    path("caja/historial/", HistorialCajaListAPIView.as_view(), name="api_historial_caja"),
    path("fondo/movimiento/", MovimientoFondoAPIView.as_view(), name="api_movimiento_fondo"),
    path("fondo/historial/", MovimientoFondoListAPIView.as_view(), name="api_historial_fondo"),
]

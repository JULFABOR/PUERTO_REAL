# urls.py
from django.urls import path
from .views import panel_caja, retiro_medio_turno, rendir_fondo
from .views import AbrirCajaAPIView, HistorialCajaListAPIView, RetiroAPIView, RendirFondoAPIView, CerrarCajaAPIView, CajaEstadoAPIView, MovimientoFondoAPIView, MovimientoFondoListAPIView

urlpatterns = [
    # Regular Django Views
    path("caja/", panel_caja, name="panel_caja"),
    path("caja/retiro/", retiro_medio_turno, name="retiro_medio_turno"),
    path("caja/rendir-fondo/", rendir_fondo, name="rendir_fondo"),

    # API Views
    path("api/caja/abrir/", AbrirCajaAPIView.as_view(), name="api_abrir_caja"),
    path("api/caja/estado/", CajaEstadoAPIView.as_view(), name="api_caja_estado"),
    path("api/caja/retiro/", RetiroAPIView.as_view(), name="api_retiro_caja"),
    path("api/caja/rendir/", RendirFondoAPIView.as_view(), name="api_rendir_fondo"),
    path("api/caja/cerrar/", CerrarCajaAPIView.as_view(), name="api_cerrar_caja"),
    path("api/caja/historial/", HistorialCajaListAPIView.as_view(), name="api_historial_caja"),
    path("api/fondo/movimiento/", MovimientoFondoAPIView.as_view(), name="api_movimiento_fondo"),
    path("api/fondo/historial/", MovimientoFondoListAPIView.as_view(), name="api_historial_fondo"),
]
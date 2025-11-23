# urls.py
from django.urls import path
from .views import panel_caja, retiro_medio_turno, rendir_fondo
from .views import (
    AbrirCajaAPIView, HistorialCajaListAPIView, RetiroAPIView, 
    RendirFondoAPIView, CerrarCajaAPIView, CajaEstadoAPIView, 
    MovimientoFondoAPIView, MovimientoFondoListAPIView, CajaViewSet, 
    DistinctHistoryDatesAPIView
)

app_name = 'Abrir_Cerrar_CAJA'

web_urlpatterns = [
    # Regular Django Views
    path("", panel_caja, name="panel_caja"),
    path("retiro/", retiro_medio_turno, name="retiro_medio_turno"),
    path("rendir-fondo/", rendir_fondo, name="rendir_fondo"),
]

api_urlpatterns = [
    # Rutas del ViewSet (manuales)
    path("cajas/", CajaViewSet.as_view({'get': 'list'}), name="api_caja_list"),
    path("cajas/<int:pk>/", CajaViewSet.as_view({'get': 'retrieve'}), name="api_caja_detail"),

    # API Views (vistas individuales)
    path("abrir/", AbrirCajaAPIView.as_view(), name="api_abrir_caja"),
    path("estado/", CajaEstadoAPIView.as_view(), name="api_caja_estado"),
    path("retiro/", RetiroAPIView.as_view(), name="api_retiro_caja"),
    path("rendir/", RendirFondoAPIView.as_view(), name="api_rendir_fondo"),
    path("cerrar/", CerrarCajaAPIView.as_view(), name="api_cerrar_caja"),
    path("historial/", HistorialCajaListAPIView.as_view(), name="api_historial_caja"),
    path("historial/dates/", DistinctHistoryDatesAPIView.as_view(), name="api_historial_caja_dates"),
    path("fondo/movimiento/", MovimientoFondoAPIView.as_view(), name="api_movimiento_fondo"),
    path("fondo/historial/", MovimientoFondoListAPIView.as_view(), name="api_historial_fondo"),

    # Esta línea vincula 'POST /api/caja/movimiento/' a tu acción 'movimiento_manual'
    path("movimiento/", CajaViewSet.as_view({'post': 'movimiento_manual'}), name="api_caja_movimiento_manual"),
]
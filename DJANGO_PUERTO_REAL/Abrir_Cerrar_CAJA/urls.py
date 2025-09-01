# urls.py
from django.urls import path
from .views import abrir_caja, retiro_medio_turno, rendir_fondo

urlpatterns = [
    path("caja/abrir/", abrir_caja, name="abrir_caja"),
    path("caja/retiro/", retiro_medio_turno, name="retiro_medio_turno"),
    path("caja/rendir-fondo/", rendir_fondo, name="rendir_fondo"),
]

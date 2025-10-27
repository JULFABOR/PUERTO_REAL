from django.urls import path, include
from rest_framework.routers import DefaultRouter
# --- IMPORTA LA NUEVA VISTA DE ESTADOS ---
from .views import CompraViewSet, ProveedorViewSet, ProveedorListView, EstadoProveedorListAPIView

# Router para la API (Mantenemos ViewSets)
router = DefaultRouter()
router.register(r'compras', CompraViewSet, basename='compra') # Es buena práctica añadir basename
router.register(r'proveedores', ProveedorViewSet, basename='proveedor') # Es buena práctica añadir basename

# URLs para las páginas web (plantillas de Django)
urlpatterns = [
    path('proveedores/', ProveedorListView.as_view(), name='proveedor_list'),
]

# URLs para la API
api_urlpatterns = [
    path('', include(router.urls)), # Incluye las rutas de los ViewSets (/compras/, /proveedores/)

    # --- RUTA AÑADIDA PARA LOS ESTADOS ---
    path("estados-proveedor/", EstadoProveedorListAPIView.as_view(), name="api_estados_proveedor"),
]

# --- IMPORTANTE ---
# Asegúrate de que este archivo `urls.py` esté incluido correctamente
# en el `urls.py` principal de tu proyecto, usualmente bajo un prefijo como 'api/compras/'.
# Ejemplo en el urls.py del proyecto:
# path('api/compras/', include('Control_COMPRAS.urls_api')), # Asumiendo que renombras api_urlpatterns
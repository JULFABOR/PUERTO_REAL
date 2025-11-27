"""
Configuración de URL para el proyecto DJANGO_PUERTO_REAL.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

# Se importan las listas de URLs de las apps
from Control_VENTAS.urls import api_urlpatterns as ventas_api_urls
from Control_COMPRAS.urls import api_urlpatterns as compras_api_urls
from Control_STOCK.urls import api_urlpatterns as stock_api_urls
from Fidelizar_CLIENTES.urls import api_urlpatterns as fidelizar_api_urls
from Abrir_Cerrar_CAJA.urls import api_urlpatterns as caja_api_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('autenticacion.urls')),
    path('', include('HOME.urls')),
    
    # Rutas de la App de Análisis
    path('api/analisis/', include('Analizar_INGRESOS_EGRESOS.urls')),
    
    # Rutas de API
    path('api/ventas/', include(ventas_api_urls)),
    path('api/compras/', include(compras_api_urls)),
    path('api/stock/', include(stock_api_urls)),
    path('api/fidelizacion/', include(fidelizar_api_urls)),
    path('api/caja/', include(caja_api_urls)),
    
    # Ruta de Auditoría
    path('auditoria/', include('Auditoria.urls')),
]

# Esto debe estar ANTES del catch-all route del SPA
if settings.DEBUG:
    # En desarrollo, Django sirve los archivos media directamente
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # En producción, también necesitamos esta configuración si no usas nginx/apache
    # Si usas nginx, comenta esta línea y configura nginx para servir /media/
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# CATCH-ALL ROUTE para Single Page Application (SPA)
urlpatterns += [
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]
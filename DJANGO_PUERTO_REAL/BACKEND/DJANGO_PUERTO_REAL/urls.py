"""
Configuración de URL para el proyecto DJANGO_PUERTO_REAL.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.authtoken.views import obtain_auth_token

# Se importan las listas de URLs de las apps
# --- INICIO: Bloque comentado para depuración ---
# from Control_VENTAS.urls import urlpatterns as ventas_web_urls
from Control_VENTAS.urls import api_urlpatterns as ventas_api_urls
# from Control_COMPRAS.urls import urlpatterns as compras_web_urls
from Control_COMPRAS.urls import api_urlpatterns as compras_api_urls
# from Control_STOCK.urls import urlpatterns as stock_web_urls
from Control_STOCK.urls import api_urlpatterns as stock_api_urls
# from Fidelizar_CLIENTES.urls import urlpatterns as fidelizar_web_urls
from Fidelizar_CLIENTES.urls import api_urlpatterns as fidelizar_api_urls
# from Abrir_Cerrar_CAJA.urls import web_urlpatterns as caja_web_urls
from Abrir_Cerrar_CAJA.urls import api_urlpatterns as caja_api_urls
# --- FIN: Bloque comentado para depuración ---


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('autenticacion.urls')), # Rutas de autenticación
    path('', include('HOME.urls')),

    # Rutas de la App de Análisis (exclusivo para Staff)
    path('api/analisis/', include('Analizar_INGRESOS_EGRESOS.urls')),
    # --- INICIO: Bloque comentado para depuración ---
    # # Rutas de las páginas web de las apps
    # path('ventas/', include((ventas_web_urls, 'ventas'), namespace='ventas')),
    # path('compras/', include(compras_web_urls)),
    # path('stock/', include((stock_web_urls, 'stock'), namespace='stock')),
    # path('fidelizacion/', include(fidelizar_web_urls)),
    # path('caja/', include(caja_web_urls)),

    # # Rutas de API
    # path('api/token-auth/', obtain_auth_token, name='api_token_auth'), # Para obtener tokens
    path('api/ventas/', include(ventas_api_urls)),
    path('api/compras/', include(compras_api_urls)),
    path('api/stock/', include(stock_api_urls)),
    path('api/fidelizacion/', include(fidelizar_api_urls)),
    path('api/caja/', include(caja_api_urls)),

    # Rutas de la API de Configuración
    path('api/configuracion/', include('Config_PR.urls')),

    # --- FIN: Bloque comentado para depuración ---
    
    # Nueva ruta para la app de Auditoria
    path('auditoria/', include('Auditoria.urls')),

    # Las rutas de la API de reportes ahora deberían estar en Analizar_INGRESOS_EGRESOS/urls.py si se quiere mantener consistencia
    # Por ahora, se dejan comentadas o se pueden mover a la app correspondiente.
    # path('api/financial-report/', financial_report_view, name='financial_report'),
    # path('api/product-sales-trends/', product_sales_trends_report_view, name='product_sales_trends'),
    # path('api/expense-breakdown/', expense_breakdown_report_view, name='expense_breakdown'),

    # CATCH-ALL ROUTE para Single Page Application (SPA)
    # Esta ruta debe ir al final. Sirve el index.html principal del frontend
    # para cualquier ruta no capturada anteriormente, permitiendo el enrutamiento del lado del cliente.
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]

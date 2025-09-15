from django.urls import path
from . import views


app_name = "home"


urlpatterns = [
# INDEX (root)
path("", views.index_root, name="index"),
path("publico/", views.index_publico, name="index_publico"),
path("privado/", views.index_privado_staff, name="index_privado_staff"),


# Logins / registro
path("login/staff/", views.login_staff, name="login_staff"),
path("login/cliente/", views.login_cliente, name="login_cliente"),
path("registro/cliente/", views.registro_cliente, name="registro_cliente"),
path("logout/", views.logout_view, name="logout"),


# HOME (staff)
path("home/", views.home_inicio, name="home_inicio"),
path('configuracion/', views.ConfiguracionView.as_view(), name='configuracion'),
path('analisis/', views.AnalisisView.as_view(), name='analisis'),
path('caja/', views.CajaView.as_view(), name='caja'),
path('cliente-perfil/', views.ClientePerfilView.as_view(), name='cliente_perfil'),
path('clientes/', views.ClientesView.as_view(), name='clientes'),
path('control-stock/', views.ControlStockView.as_view(), name='control_stock'),
path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
path('login-register/', views.LoginRegisterView.as_view(), name='login_register'),
path('proveedores/', views.ProveedoresView.as_view(), name='proveedores'),
path('stock/', views.StockView.as_view(), name='stock'),
path('venta/', views.VentaView.as_view(), name='venta'),


# Routers a módulos (puentes)
path("fn/caja/", views.fn_caja, name="fn_caja"),
path("fn/ventas/", views.fn_ventas, name="fn_ventas"),
path("fn/compras/", views.fn_compras, name="fn_compras"),
path("fn/stock/", views.fn_stock, name="fn_stock"),
path("fn/fidelizacion/", views.fn_fidelizacion, name="fn_fidelizacion"),
path("fn/reportes/", views.fn_reportes, name="fn_reportes"),

# Gestión de Caja
path("caja/abrir/", views.abrir_caja_view, name="abrir_caja"),
]
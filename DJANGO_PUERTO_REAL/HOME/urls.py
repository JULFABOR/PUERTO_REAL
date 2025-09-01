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


# Routers a módulos (puentes)
path("fn/caja/", views.fn_caja, name="fn_caja"),
path("fn/ventas/", views.fn_ventas, name="fn_ventas"),
path("fn/compras/", views.fn_compras, name="fn_compras"),
path("fn/stock/", views.fn_stock, name="fn_stock"),
path("fn/fidelizacion/", views.fn_fidelizacion, name="fn_fidelizacion"),
path("fn/reportes/", views.fn_reportes, name="fn_reportes"),
]
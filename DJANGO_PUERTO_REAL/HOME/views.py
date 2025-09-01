from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods


from .forms import StaffLoginForm, ClienteLoginForm, ClienteRegistroForm
from . import services as S

# =============== INDEX (root) ==================


def index_root(request):
    network_ok = S.ping_red()
    backend_ok = S.ping_backend()
    if not (network_ok and backend_ok):
        messages.error(request, "Sin conexión con el servidor. Reintentá o trabajá en modo limitado.")


    autenticado = request.user.is_authenticated or request.session.get("autenticado_cliente", False)


    if not autenticado:
        return redirect("home:index_publico")


# Session.rol: "ADMIN" | "EMPLEADO" | "CLIENTE"
    rol = request.session.get("rol")
    if rol in ("ADMIN", "EMPLEADO") or request.user.is_authenticated:
        return redirect("home:index_privado_staff")
    if rol == "CLIENTE" or request.session.get("autenticado_cliente"):
# Redirigir a app cliente real si existe
        return redirect("home:index_publico") # TODO: reemplazar por url de App Cliente


# fallback
    logout_view(request)
    return redirect("home:index_publico")

def index_publico(request):
    ctx = {
        "hero": {
        "titulo": "Sistema Puerto Real",
        "subtitulo": "Ventas, Compras, Stock y Fidelización en un solo lugar.",
        }
    }
    return render(request, "home/index_publico.html", ctx)

@login_required(login_url="/login/staff/")
def index_privado_staff(request):
    estado_caja = S.obtener_estado_caja()
    saldo_caja = S.kpi_saldo_caja_actual()


    kpi = {
        "ventas_dia": S.kpi_ventas(*S.parse_rango("hoy")[:2]),
        "tickets_dia": S.kpi_tickets(*S.parse_rango("hoy")[:2]),
        "egresos_dia": S.kpi_egresos_operativos(*S.parse_rango("hoy")[:2]),
    }


    alertas = []
    if S.hay_stock_bajo():
        alertas.append({"tipo": "warn", "msg": "Productos bajo mínimo"})
    if S.cxp_vencen_hoy():
        alertas.append({"tipo": "warn", "msg": "Cuentas por pagar vencen hoy"})
    if estado_caja == "CERRADO":
        alertas.append({"tipo": "error", "msg": "Abrí la caja para operar ventas"})
    if S.fondos_pagos_bajo_saldo():
        alertas.append({"tipo": "warn", "msg": "Fondo de Pagos con saldo bajo"})


    ctx = {
        "estado_caja": estado_caja,
        "saldo_caja": saldo_caja,
        "kpi": kpi,
        "alertas": alertas,
        "acciones": [
            ("Nueva Venta" if estado_caja == "ABIERTO" else "Abrir Caja"),
            "Nueva Compra",
            "Control de Stock",
            "Cargar puntos (QR última venta)",
            "Fidelización",
        ],
        "cards_modulos": [
            {"titulo": "Caja", "desc": "Apertura/Retiro/Rendir/Cierre", "href": reverse("home:fn_caja")},
            {"titulo": "Ventas", "desc": "Nueva, Mostrar, Anular ≤5m", "href": reverse("home:fn_ventas")},
            {"titulo": "Compras", "desc": "Nueva, Mostrar, Agregar producto", "href": reverse("home:fn_compras")},
            {"titulo": "Stock", "desc": "Ajustes, mínimos, alertas", "href": reverse("home:fn_stock")},
            {"titulo": "Fidelización", "desc": "Config, Cupones, Puntos QR", "href": reverse("home:fn_fidelizacion")},
            {"titulo": "Reportes", "desc": "Ingresos/Egresos, Top, Heatmap", "href": reverse("home:fn_reportes")},
            ],
    }
    return render(request, "home/index_privado_staff.html", ctx)

# =============== LOGIN / LOGOUT ==================


def login_staff(request):
    form = StaffLoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = S.autenticar_staff(form.cleaned_data["usuario"], form.cleaned_data["password"])
        if user:
            login(request, user)
            request.session["rol"] = "ADMIN" if user.is_superuser else "EMPLEADO"
            request.session["permisos"] = S.cargar_permisos(user.id)
            sucursales = S.listar_sucursales_de_usuario(user.id)
            request.session["sucursal_actual"] = sucursales[0] if sucursales else None
            return redirect("home:index_privado_staff")
        messages.error(request, "Credenciales inválidas.")
    return render(request, "home/index_publico.html", {"form_staff": form, "focus_login_staff": True})

def login_cliente(request):
    form = ClienteLoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        auth = S.autenticar_cliente(
            form.cleaned_data["dni_o_email"], form.cleaned_data["pin_o_password"]
        )
        if auth.get("ok"):
            request.session["autenticado_cliente"] = True
            request.session["rol"] = "CLIENTE"
            request.session["cliente_id"] = auth.get("cliente_id")
            # TODO: redirigir a app cliente real
            return redirect("home:index_publico")
        messages.error(request, "Datos incorrectos.")
    return render(request, "home/index_publico.html", {"form_cliente": form, "focus_login_cliente": True})

def registro_cliente(request):
    form = ClienteRegistroForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        res = S.crear_cliente(form.cleaned_data)
        if res.get("ok"):
            messages.success(request, "Cuenta creada. ¡Ingresá con tu DNI y PIN!")
            return redirect("home:login_cliente")
        messages.error(request, res.get("error", "Error al crear la cuenta"))
    return render(request, "home/index_publico.html", {"form_registro": form, "focus_registro": True})




def logout_view(request):
    logout(request)
    # limpiar flags cliente
    request.session.pop("autenticado_cliente", None)
    request.session.pop("cliente_id", None)
    request.session.pop("rol", None)
    return redirect("home:index_publico")

# =============== HOME (staff, sin charts) ==================
@login_required(login_url="/login/staff/")
def home_inicio(request):
    rango = request.GET.get("rango", "hoy").lower()
    desde = request.GET.get("desde")
    hasta = request.GET.get("hasta")
    start, end, label = S.parse_rango(rango, desde, hasta)


    estado_caja = S.obtener_estado_caja()
    saldo_caja = S.kpi_saldo_caja_actual()


    ventas_total = S.kpi_ventas(start, end)
    tickets = S.kpi_tickets(start, end)
    egresos = S.kpi_egresos_operativos(start, end)


    ventas_tabla = S.listar_ventas(start, end, ordenar="-fecha_hora", limite=50)


    ctx = {
        "label_rango": label,
        "rango": rango,
        "estado_caja": estado_caja,
        "saldo_caja": saldo_caja,
        "ventas_total": ventas_total,
        "tickets": tickets,
        "egresos": egresos,
        "ventas": ventas_tabla,
    }
    return render(request, "home/home_inicio.html", ctx)




# =============== Routers/puentes a módulos ===============
@login_required(login_url="/login/staff/")
def fn_caja(request):
    # Submenú: Abrir Caja, Retiro, Rendir, Cerrar, Movimientos
    if S.obtener_estado_caja() == "ABIERTO":
        return redirect("caja:panel") if url_exists("caja:panel") else redirect("home:home_inicio")
    return redirect("caja:apertura") if url_exists("caja:apertura") else redirect("home:home_inicio")




@login_required(login_url="/login/staff/")
def fn_ventas(request):
    return redirect("ventas:nueva") if url_exists("ventas:nueva") else redirect("home:home_inicio")




@login_required(login_url="/login/staff/")
def fn_compras(request):
    return redirect("compras:nueva") if url_exists("compras:nueva") else redirect("home:home_inicio")

@login_required(login_url="/login/staff/")
def fn_stock(request):
    return redirect("stock:control") if url_exists("stock:control") else redirect("home:home_inicio")




@login_required(login_url="/login/staff/")
def fn_fidelizacion(request):
    return redirect("fidelizacion:config") if url_exists("fidelizacion:config") else redirect("home:home_inicio")




@login_required(login_url="/login/staff/")
def fn_reportes(request):
    return redirect("reportes:panel") if url_exists("reportes:panel") else redirect("home:home_inicio")




# =============== Utils internos ===============
from django.urls import NoReverseMatch


def url_exists(name: str) -> bool:
    try:
        reverse(name)
        return True
    except NoReverseMatch:
        return False
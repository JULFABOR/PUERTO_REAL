from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from rest_framework.decorators import api_view
from rest_framework.response import Response


from .forms import StaffLoginForm, ClienteLoginForm, ClienteRegistroForm
from . import services as S

# =============== INDEX (root) ==================


def index_root(request):
    network_ok = S.ping_red()
    backend_ok = S.ping_backend()
    if not (network_ok and backend_ok):
        messages.error(request, "Sin conexión con el servidor. Reintentá o trabajá en modo limitado.")


    # Check if any user is authenticated (staff or client)
    if request.user.is_authenticated:
        # Staff user is authenticated
        return redirect("home:index_privado_staff")
    elif request.session.get("autenticado_cliente"):
        # Client user is authenticated via session
        cliente_id = request.session.get("cliente_id")
        if cliente_id:
            return redirect("fidelizacion:cliente_perfil", cliente_id=cliente_id)
        else:
            # Fallback if cliente_id is missing for an authenticated client
            messages.error(request, "Error de sesión de cliente. Por favor, inicia sesión de nuevo.")
            logout(request) # Log out the client if session is inconsistent
            return redirect("home:index_publico")
    else:
        # No user is authenticated, redirect to public index
        return redirect("home:index_publico")

    # The original "fallback" section is now covered by the explicit checks above.
    # If execution reaches here, it implies an unhandled state, which should ideally not happen.
    # As a last resort, ensure logout and redirect to public.
    messages.error(request, "Estado de sesión inesperado. Redirigiendo a la página pública.")
    logout(request) # Ensure full logout
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
    return render(request, "HOME/Home.html", ctx)


@method_decorator(login_required, name='dispatch')
class ConfiguracionView(TemplateView):
    template_name = 'HOME/Configuracion.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Configuración"
        return context

@method_decorator(login_required, name='dispatch')
class AnalisisView(TemplateView):
    template_name = 'HOME/Analisis.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Análisis"
        return context

@method_decorator(login_required, name='dispatch')
class CajaView(TemplateView):
    template_name = 'HOME/Caja.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Caja"
        return context

@method_decorator(login_required, name='dispatch')
class ClientePerfilView(TemplateView):
    template_name = 'HOME/Cliente-Perfil.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Perfil de Cliente"
        return context

@method_decorator(login_required, name='dispatch')
class ClientesView(TemplateView):
    template_name = 'HOME/Clientes.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Clientes"
        return context

@method_decorator(login_required, name='dispatch')
class ControlStockView(TemplateView):
    template_name = 'HOME/Control-Stock.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Control de Stock"
        return context

@method_decorator(login_required, name='dispatch')
class ForgotPasswordView(TemplateView):
    template_name = 'HOME/Forgot-Password.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Recuperar Contraseña"
        return context

@method_decorator(login_required, name='dispatch')
class LoginRegisterView(TemplateView):
    template_name = 'HOME/Login-register.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Login / Registro"
        return context

@method_decorator(login_required, name='dispatch')
class ProveedoresView(TemplateView):
    template_name = 'HOME/Proveedores.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Proveedores"
        return context

@method_decorator(login_required, name='dispatch')
class StockView(TemplateView):
    template_name = 'HOME/Stock.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Stock"
        return context

@method_decorator(login_required, name='dispatch')
class VentaView(TemplateView):
    template_name = 'HOME/Venta.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Venta"
        return context

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
            cliente_id = auth.get("cliente_id")
            request.session["cliente_id"] = cliente_id
            if cliente_id:
                return redirect("fidelizacion:cliente_perfil", cliente_id=cliente_id)
            return redirect("home:index_publico") # Fallback if cliente_id is missing
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

# =============== GESTIÓN DE CAJA ===============
from .models import Cajas, Empleados, Historial_Caja, Estados, Tipo_Evento

@login_required(login_url="/login/staff/")
def abrir_caja_view(request):
    if request.method == 'POST':
        monto_inicial = request.POST.get('monto_inicial')
        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "Tu usuario no está asociado a un empleado.")
            return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')

        # --- INICIO DE LA LÓGICA DE VALIDACIÓN ---
        try:
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
            tipo_evento_apertura = Tipo_Evento.objects.get(nombre_evento='APERTURA')
        except Estados.DoesNotExist:
            messages.error(request, "Error de configuración: El estado 'ABIERTO' no existe.")
            return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')
        except Tipo_Evento.DoesNotExist:
            messages.error(request, "Error de configuración: El tipo de evento 'APERTURA' no existe.")
            return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')

        # Regla 1: Validar que no haya más de 2 cajas abiertas en total.
        cajas_abiertas_count = Cajas.objects.filter(estado_caja=estado_abierto).count()
        if cajas_abiertas_count >= 2:
            messages.error(request, "Límite alcanzado: Ya hay 2 cajas abiertas en el sistema.")
            return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')

        # Regla 2: Validar que este empleado no tenga ya una caja abierta.
        cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
        if Cajas.objects.filter(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto).exists():
            messages.error(request, f"Ya tienes una caja abierta. No puedes abrir otra.")
            return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')

        # --- FIN DE LA LÓGICA DE VALIDACIÓN ---

        # Si todas las validaciones pasan, crea la nueva caja.
        nueva_caja = Cajas.objects.create(
            monto_apertura_caja=monto_inicial,
            estado_caja=estado_abierto,
            total_gastos_caja=0, # Inicializando campos
            monto_cierre_caja=0,
            monto_teorico_caja=0,
            diferencia_caja=0,
            observaciones_caja=''
        )

        # Crea el registro en el historial para enlazarla al empleado.
        Historial_Caja.objects.create(
            caja_hc=nueva_caja,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_apertura,
            cantidad_movida_hcaja=monto_inicial, # Guardando el monto de apertura
            saldo_anterior_hcaja=0,
            nuevo_saldo_hcaja=monto_inicial,
            descripcion_hcaja='Apertura de caja'
        )

        messages.success(request, "Caja abierta exitosamente.")
        return redirect("home:index_privado_staff") # Redirige al dashboard

    # Si es un GET, solo muestra el formulario
    return render(request, 'Abrir_Cerrar_CAJA/caja/abrir.html')

@api_view(['GET'])
def api_saludo(request):
    """
    Un endpoint de API de saludo para la integración con el frontend.
    """
    return Response({"mensaje": "¡Hola desde la API de Django!"})

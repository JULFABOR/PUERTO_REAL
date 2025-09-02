from datetime import datetime, timedelta
from typing import Tuple, Optional
from django.utils import timezone
from django.db.models import Sum, Count


# ==== Helpers de rango ====


def _today_bounds() -> Tuple[datetime, datetime]:
    now = timezone.localtime()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end



def parse_rango(rango: str, desde: Optional[str] = None, hasta: Optional[str] = None) -> Tuple[datetime, datetime, str]:
#Devuelve (start, end, label). Admite: hoy|semana|mes o fechas YYYY-MM-DD"""
    now = timezone.localtime()
    if rango == "semana":
        # Lunes a hoy (o semana completa)
        inicio_semana = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        fin_semana = inicio_semana + timedelta(days=7)
        return inicio_semana, fin_semana, "Semana"
    if rango == "mes":
        inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # siguiente mes
        if inicio_mes.month == 12:
            siguiente = inicio_mes.replace(year=inicio_mes.year + 1, month=1)
        else:
            siguiente = inicio_mes.replace(month=inicio_mes.month + 1)
        return inicio_mes, siguiente, "Mes"
    if desde and hasta:
        start = timezone.make_aware(datetime.strptime(desde, "%Y-%m-%d")).replace(hour=0, minute=0, second=0, microsecond=0)
        end = timezone.make_aware(datetime.strptime(hasta, "%Y-%m-%d")).replace(hour=23, minute=59, second=59, microsecond=999999)
        return start, end, f"{desde} a {hasta}"
    start, end = _today_bounds()
    return start, end, "Hoy"




# ==== KPI y estado de caja ====


def kpi_ventas(start, end) -> float:
    try:
        from HOME.models import Ventas
        total = (
            Ventas.objects.filter(fecha_hora__gte=start, fecha_hora__lt=end, DELETE=False)
            .aggregate(s=Sum("total"))
            .get("s")
        ) or 0
        return float(total)
    except Exception:
        return 0.0

def kpi_tickets(start, end) -> int:
    try:
        from HOME.models import Ventas
        return (
            Ventas.objects.filter(fecha_hora__gte=start, fecha_hora__lt=end, DELETE=False)
            .count()
    )
    except Exception:
        return 0

def kpi_egresos_operativos(start, end) -> float:
    """Solo egresos operativos, excluyendo transferencias internas."""
    try:
        from HOME.models import Historial_Caja
        qs = Historial_Caja.objects.filter(
            fecha_hora__gte=start,
            fecha_hora__lt=end,
            tipo__in=["EGRESO", "GASTO"],
            es_transferencia=False,
            DELETE=False,
        )
        total = qs.aggregate(s=Sum("monto")).get("s") or 0
        return float(total)
    except Exception:
        return 0.0

def obtener_estado_caja() -> str:
    try:
        from HOME.models import Cajas
        caja = Cajas.objects.order_by("-fecha").first()
        return caja.estado_caja if caja else "CERRADO"
    except Exception:
        return "CERRADO"




def kpi_saldo_caja_actual() -> float:
    try:
        from HOME.models import Cajas
        caja = Cajas.objects.order_by("-fecha").first()
        return float(caja.monto_cierre_caja) if caja and caja.monto_cierre_caja is not None else 0.0  
    except Exception:
        return 0.0


# ==== Listados ====


def listar_ventas(start, end, ordenar: str = "-fecha_hora", limite: int = 50):
    try:
        from HOME.models import Ventas
        qs = (
            Ventas.objects.select_related("cajero")
            .filter(fecha_hora__gte=start, fecha_hora__lt=end, DELETE=False)
            .order_by(ordenar)
        )
        return list(qs[:limite])
    except Exception:
        return []




# ==== Autenticación y permisos básicos ====


def autenticar_staff(usuario: str, password: str):
    """Permite usuario o email."""
    from django.contrib.auth import authenticate, get_user_model
    User = get_user_model()
    user = None
    # probar por username
    user = authenticate(username=usuario, password=password)
    if user is None:
    # probar por email
        try:
            u = User.objects.get(email__iexact=usuario)
            user = authenticate(username=u.username, password=password)
        except User.DoesNotExist:
            user = None
    return user

def cargar_permisos(user_id) -> list:
    # Integra con tu sistema real de permisos si aplica
    return ["ventas.ver", "compras.ver", "stock.ajustar"]




def listar_sucursales_de_usuario(user_id) -> list:
    # Reemplazá por tu modelo real de Sucursales/Asignaciones
    return ["Sucursal Principal"]




def autenticar_cliente(dni_o_email: str, pin_o_password: str):
    """TODO: Implementar contra tu modelo Cliente. Devolver dict {ok, cliente_id}."""
    return {"ok": False}




def crear_cliente(datos: dict):
    """TODO: Implementar creación real. Devolver {ok, error?}."""
    return {"ok": False, "error": "Implementar persistencia de clientes"}




# ==== Pings (placeholders) ====


def ping_red() -> bool:
    return True




def ping_backend() -> bool:
    return True


# ==== Global Search (placeholder) ====


def global_search(query: str):
    # Devolvé una estructura mixta según tus modelos reales
    return []


# ==== Alertas (placeholders) ====
def hay_stock_bajo() -> bool:
    return False


def cxp_vencen_hoy() -> bool:
    return False


def fondos_pagos_bajo_saldo() -> bool:
    return False
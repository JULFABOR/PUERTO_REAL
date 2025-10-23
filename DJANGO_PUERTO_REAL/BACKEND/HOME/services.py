from datetime import datetime, timedelta
from typing import Tuple, Optional
from django.utils import timezone
from django.db.models import Sum, Count, F
from django.contrib.auth import get_user_model, authenticate
from django.db import models

from .models import (
    Ventas,
    Historial_Caja,
    Cajas,
    Clientes,
    Productos,
    Stocks,
    Compras,
    Fondo_Pagos,
)

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
        total = (
            Ventas.objects.filter(fecha_venta__gte=start, fecha_venta__lt=end, DELETE_Vent=False)
            .aggregate(s=Sum("total_venta"))
            .get("s")
        ) or 0
        return float(total)
    except Exception as e:
        print(f"Error en kpi_ventas: {e}")
        return 0.0

def kpi_tickets(start, end) -> int:
    try:
        return (
            Ventas.objects.filter(fecha_venta__gte=start, fecha_venta__lt=end, DELETE_Vent=False)
            .count()
        )
    except Exception as e:
        print(f"Error en kpi_tickets: {e}")
        return 0

def kpi_egresos_operativos(start, end) -> float:
    """Solo egresos operativos, excluyendo transferencias internas."""
    try:
        qs = Historial_Caja.objects.filter(
            fecha_movimiento_hcaja__gte=start,
            fecha_movimiento_hcaja__lt=end,
            tipo_event_caja__nombre_evento__in=["EGRESO", "GASTO"],
            DELETE_Hcaja=False,
        ).exclude(destino_movimiento='PARA_PAGOS_FONDO') # Excluir transferencias internas al fondo de pagos
        
        total = qs.aggregate(s=Sum("cantidad_movida_hcaja")).get("s") or 0
        return float(total)
    except Exception as e:
        print(f"Error en kpi_egresos_operativos: {e}")
        return 0.0

def obtener_estado_caja() -> str:
    try:
        caja = Cajas.objects.order_by("-id_caja").first()
        return caja.estado_caja.nombre_estado if caja else "CERRADA"
    except Exception as e:
        print(f"Error en obtener_estado_caja: {e}")
        return "CERRADA"

def kpi_saldo_caja_actual() -> float:
    try:
        caja = Cajas.objects.order_by("-id_caja").first()
        return float(caja.monto_cierre_caja) if caja and caja.monto_cierre_caja is not None else 0.0  
    except Exception as e:
        print(f"Error en kpi_saldo_caja_actual: {e}")
        return 0.0

# ==== Listados ==== 

def listar_ventas(start, end, ordenar: str = "-fecha_venta", limite: int = 50):
    try:
        qs = (
            Ventas.objects.select_related("empleado_venta__user_empleado")
            .filter(fecha_venta__gte=start, fecha_venta__lt=end, DELETE_Vent=False)
            .order_by(ordenar)
        )
        return list(qs[:limite])
    except Exception as e:
        print(f"Error en listar_ventas: {e}")
        return []

# ==== Autenticación y permisos básicos ==== 

def autenticar_staff(usuario: str, password: str):
    """Permite usuario o email."""
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
    """Implementar contra tu modelo Cliente. Devolver dict {ok, cliente_id}."""
    User = get_user_model()
    try:
        # Try to find client by DNI
        cliente = Clientes.objects.get(dni_cliente=dni_o_email)
        if cliente.user_cliente.check_password(pin_o_password): # Assuming PIN is stored as password
            return {"ok": True, "cliente_id": cliente.id_cliente, "user": cliente.user_cliente}
    except Clientes.DoesNotExist:
        pass

    try:
        # Try to find client by email
        user = User.objects.get(email__iexact=dni_o_email)
        if user.check_password(pin_o_password):
            try:
                cliente = Clientes.objects.get(user_cliente=user)
                return {"ok": True, "cliente_id": cliente.id_cliente, "user": user}
            except Clientes.DoesNotExist:
                pass
    except User.DoesNotExist:
        pass

    return {"ok": False, "error": "DNI/Email o PIN/Contraseña incorrectos."}

def crear_cliente(datos: dict):
    """Implementar creación real. Devolver {ok, error?}."""
    User = get_user_model()
    try:
        # Create a new User instance
        user = User.objects.create_user(
            username=datos['dni'], # Using DNI as username for simplicity
            email=datos.get('email', ''),
            password=datos['pin']
        )
        user.first_name = datos.get('nombre', '')
        user.last_name = datos.get('apellido', '')
        user.save()

        # Create a new Cliente instance
        cliente = Clientes.objects.create(
            user_cliente=user,
            dni_cliente=datos['dni'],
            telefono_cliente=datos.get('telefono', '') # Assuming 'telefono' might be in datos
        )
        # You might want to handle 'direccion' separately if it's a related model
        return {"ok": True, "cliente_id": cliente.id_cliente}
    except Exception as e:
        return {"ok": False, "error": str(e)}

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
    try:
        # Find products where current stock is below the low_stock_threshold
        low_stock_products = Productos.objects.filter(
            DELETE_Prod=False,
            stocks__cantidad_actual_stock__lt=F('low_stock_threshold')
        ).distinct()
        return low_stock_products.exists()
    except Exception:
        return False

def cxp_vencen_hoy() -> bool:
    today = timezone.localdate()
    try:
        expiring_purchases = Compras.objects.filter(
            fecha_limite__date=today,
            estado_compra__nombre_estado="PENDIENTE", # Assuming an 'PENDIENTE' state for purchases
            DELETE_Comp=False
        ).exists()
        return expiring_purchases
    except Exception:
        return False

def fondos_pagos_bajo_saldo() -> bool:
    LOW_BALANCE_THRESHOLD = 100.00 # Define a threshold for low balance
    try:
        low_balance_funds = Fondo_Pagos.objects.filter(
            saldo_fp__lt=LOW_BALANCE_THRESHOLD,
            estado_fp__nombre_estado="ACTIVO", # Assuming an 'ACTIVO' state for Fondo_Pagos
            DELETE_fp=False
        ).exists()
        return low_balance_funds
    except Exception:
        return False

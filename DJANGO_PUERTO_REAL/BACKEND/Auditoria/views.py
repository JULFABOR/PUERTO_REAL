from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.admin.models import LogEntry
from .models import RegistroAuditoria
from itertools import chain
from operator import attrgetter

@login_required
@staff_member_required
def audit_log_view(request):
    """
    Muestra un registro combinado de todas las acciones:
    - Cambios en el panel de administración (LogEntry).
    - Acciones personalizadas de la aplicación (RegistroAuditoria).
    """
    
    # Obtener los dos tipos de registros
    admin_logs = LogEntry.objects.all()
    app_logs = RegistroAuditoria.objects.all()

    # Mapear los registros a una estructura común para poder ordenarlos y mostrarlos
    combined_logs = []

    for log in admin_logs:
        # Mapeo para LogEntry
        action_map = {
            1: "Creación",
            2: "Modificación",
            3: "Eliminación",
        }
        combined_logs.append({
            'fecha_hora': log.action_time,
            'usuario_nombre': log.user.username,
            'tipo_registro': 'Admin',
            'accion': action_map.get(log.action_flag, "Desconocida"),
            'objeto': f"{log.content_type.model_class().__name__}: {log.object_repr}",
            'detalles': log.get_change_message()
        })

    for log in app_logs:
        # Mapeo para RegistroAuditoria
        combined_logs.append({
            'fecha_hora': log.fecha_hora,
            'usuario_nombre': log.usuario.username if log.usuario else "Sistema",
            'tipo_registro': 'Aplicación',
            'accion': log.get_accion_display(),
            'objeto': f"Acción de {log.get_accion_display()}", # O podrías sacar un objeto de los detalles si existe
            'detalles': log.detalles
        })

    # Ordenar la lista combinada por fecha, del más reciente al más antiguo
    combined_logs.sort(key=lambda x: x['fecha_hora'], reverse=True)

    context = {
        'logs': combined_logs,
        'title': 'Registro de Auditoría Unificado'
    }
    return render(request, 'Auditoria/audit_log.html', context)

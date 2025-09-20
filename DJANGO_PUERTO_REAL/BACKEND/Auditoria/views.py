from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAdminUser
from django.contrib.admin.models import LogEntry
from .models import RegistroAuditoria

def get_audit_logs(request):
    """
    Vista para obtener los registros de auditoría.
    Solo accesible para usuarios con permisos de administrador.
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'No tienes permiso para ver estos registros.'}, status=403)

    # Obtener registros de auditoría personalizados
    auditoria_logs = RegistroAuditoria.objects.all().values('usuario__username', 'accion', 'modelo', 'objeto_id', 'fecha_hora', 'cambios')
    
    # Obtener registros de cambios del admin de Django
    admin_logs = LogEntry.objects.all().values('user__username', 'action_flag', 'content_type__model', 'object_id', 'action_time', 'change_message')

    # Combinar ambos conjuntos de registros
    combined_logs = list(auditoria_logs) + list(admin_logs)

    # Ordenar por fecha y hora (asumiendo que ambos tienen un campo similar)
    combined_logs.sort(key=lambda x: x.get('fecha_hora') or x.get('action_time'), reverse=True)

    return JsonResponse({'logs': combined_logs})
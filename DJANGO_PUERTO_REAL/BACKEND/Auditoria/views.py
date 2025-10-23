from django.http import JsonResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.admin.models import LogEntry
from django.http import JsonResponse

# Local application
from .models import RegistroAuditoria

def get_audit_logs(request):
    """
    Vista para obtener los registros de auditoría con paginación.
    Solo accesible para usuarios con permisos de administrador.
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'No tienes permiso para ver estos registros.'}, status=403)

    # 1. Obtener y normalizar registros de auditoría personalizados
    # Usamos iterator() para reducir el uso de memoria al no cachear el queryset
    auditoria_logs_qs = RegistroAuditoria.objects.select_related('usuario').all().iterator()
    normalized_auditoria = [
        {
            'timestamp': log.fecha_hora,
            'username': log.usuario.username if log.usuario else 'Sistema',
            'action': log.get_accion_display(),
            'details': log.detalles,
            'source': 'custom'
        } 
        for log in auditoria_logs_qs
    ]

    # 2. Obtener y normalizar registros del admin de Django
    admin_logs_qs = LogEntry.objects.select_related('user', 'content_type').all().iterator()
    
    ACTION_FLAGS = {1: 'Creación', 2: 'Modificación', 3: 'Eliminación'}

    normalized_admin = [
        {
            'timestamp': log.action_time,
            'username': log.user.username,
            'action': f"Admin: {ACTION_FLAGS.get(log.action_flag, 'Desconocido')}",
            'details': {
                'model': log.content_type.model,
                'object': log.object_repr,
                'message': log.change_message
            },
            'source': 'admin'
        }
        for log in admin_logs_qs
    ]

    # 3. Combinar y ordenar (en memoria)
    # Advertencia: Esto puede consumir memoria si el número de logs es muy grande.
    combined_logs = sorted(normalized_auditoria + normalized_admin, key=lambda x: x['timestamp'], reverse=True)

    # 4. Paginación
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 25)
    paginator = Paginator(combined_logs, page_size)

    try:
        page_obj = paginator.page(page_number)
    except (PageNotAnInteger, EmptyPage):
        page_obj = paginator.page(1)

    # 5. Preparar la respuesta JSON
    return JsonResponse({
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'next': page_obj.next_page_number() if page_obj.has_next() else None,
        'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
        'results': list(page_obj)
    })
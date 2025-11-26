import logging
from rest_framework import permissions

logger = logging.getLogger(__name__)

class IsJefe(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'JEFE' role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if the user has the 'JEFE' role
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'JEFE'

class IsJefeOrEmpleado(permissions.BasePermission):
    """
    Custom permission to allow users with 'JEFE' or 'EMPLEADO' role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            logger.warning(f"IsJefeOrEmpleado check for user: {request.user} -> UNAUTHENTICATED")
            return False

        has_perfil = hasattr(request.user, 'perfil')
        rol = None
        if has_perfil:
            rol = request.user.perfil.rol
        
        logger.warning(f"IsJefeOrEmpleado check for user: {request.user}, IsAuthenticated: {request.user.is_authenticated}, HasPerfil: {has_perfil}, Rol: {rol}")

        if not has_perfil:
            return False
            
        return request.user.perfil.rol in ['JEFE', 'EMPLEADO']

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read-only access for anyone,
    but require authentication for write operations.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to authenticated users.
        return request.user and request.user.is_authenticated

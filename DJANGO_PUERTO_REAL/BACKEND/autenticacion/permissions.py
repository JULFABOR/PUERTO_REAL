from rest_framework import permissions

class IsJefe(permissions.BasePermission):
    """
    Custom permission to only allow users with 'JEFE' role to access an object.
    """
    def has_permission(self, request, view):
        # Assumes a user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if the user has a profile and if their role is 'JEFE'
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'JEFE'

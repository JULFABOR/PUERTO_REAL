from rest_framework import permissions

class IsJefe(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'JEFE' role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if the user has the 'JEFE' role
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'JEFE'

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

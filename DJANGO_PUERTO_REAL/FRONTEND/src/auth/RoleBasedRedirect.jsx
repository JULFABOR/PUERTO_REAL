import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const RoleBasedRedirect = () => {
    const { user, isAuthenticated, loading } = useAuth();

    // Mientras se verifica el estado de autenticación, mostrar nada o spinner
    if (loading) {
        return null;
    }

    // Si después de cargar no está autenticado, va al login
    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    // Extraer el rol de varias posibles ubicaciones
    let role = null;
    if (user?.rol) {
        role = user.rol;
    } else if (user?.perfil?.rol) {
        role = user.perfil.rol;
    } else if (user?.profile?.rol) {
        role = user.profile.rol;
    }

    // Debug: loguear para ver estructura del usuario
    if (!role) {
        console.warn('No se encontró rol en el usuario:', user);
    }

    // Normalizar rol a mayúsculas para comparación
    const normalizedRole = role ? String(role).toUpperCase().trim() : null;

    // Redirigir según rol
    if (normalizedRole === 'JEFE') {
        return <Navigate to="/jefe/home" />;
    } else if (normalizedRole === 'EMPLEADO') {
        return <Navigate to="/empleado/home" />;
    } else if (normalizedRole === 'CLIENTE') {
        return <Navigate to="/cliente/home" />;
    }

    // Si el rol no es válido, loguear y redirigir a login
    console.error('Rol inválido o no reconocido:', normalizedRole, 'Usuario:', user);
    return <Navigate to="/" />;
};

export default RoleBasedRedirect;
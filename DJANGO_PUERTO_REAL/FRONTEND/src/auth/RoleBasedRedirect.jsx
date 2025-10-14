import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // <-- 1. IMPORTAMOS EL HOOK

const RoleBasedRedirect = () => {
    // --- Usamos el hook useAuth como única fuente de verdad ---
    const { user, isAuthenticated, loading } = useAuth();

    // Mientras se verifica el estado de autenticación, no hacemos nada
    if (loading) {
        return null; // O un spinner de carga
    }

    // Si después de cargar no está autenticado, va al login
    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    const role = user?.rol;

    // --- Corregimos a 'Jefe' y 'Empleado' (con mayúscula inicial) ---
    if (role === 'Jefe') {
        return <Navigate to="/jefe/home" />;
    } else if (role === 'Empleado') {
        return <Navigate to="/empleado/home" />;
    } else if (role === 'Cliente') {
        return <Navigate to="/cliente/home" />;
    }

    // Si por alguna razón el rol no es válido, redirigimos al login
    return <Navigate to="/" />;
};

export default RoleBasedRedirect;
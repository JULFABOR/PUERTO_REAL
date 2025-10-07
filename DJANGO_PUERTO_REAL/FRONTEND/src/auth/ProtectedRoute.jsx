import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Mientras el AuthProvider está cargando el estado del usuario desde localStorage,
    // no renderizamos nada todavía para evitar parpadeos.
    if (loading) {
        return null; // O un spinner de carga
    }

    // Si el usuario no está autenticado, se redirige a la página de login.
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Si la ruta requiere roles específicos y el rol del usuario no está incluido,
    // se le redirige.
    if (allowedRoles && !allowedRoles.includes(user?.rol)) {
        // Redirigir a /home, que se encargará de la redirección final basada en rol.
        return <Navigate to="/home" replace />;
    }

    // Si todo está en orden, renderiza el componente solicitado.
    return children;
};

export default ProtectedRoute;

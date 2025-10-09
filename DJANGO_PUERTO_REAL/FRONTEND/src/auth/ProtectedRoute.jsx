import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext'; // Asegúrate que la ruta a tu contexto sea correcta

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  // 1. Si el usuario NO está autenticado, lo enviamos a la página de login.
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 2. Si la ruta requiere roles específicos, verificamos el rol del usuario.
  const isAuthorized = user && user.rol && allowedRoles.includes(user.rol);

  if (allowedRoles && !isAuthorized) {
    // 3. Si el usuario está autenticado PERO no tiene el rol permitido,
    //    lo enviamos a la página de login (o a una página de "Acceso Denegado").
    return <Navigate to="/" replace />;
  }

  // 4. Si todo está bien, renderizamos el contenido protegido.
  return children;
};

export default ProtectedRoute;
// Ruta: src/auth/AuthProvider.jsx
import React,{ useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';

// Importa el contexto desde tu archivo de hooks (¡esta ruta es correcta!)
import { AuthContext } from '@/hooks/useAuth';

// Esta es la ÚNICA exportación del archivo
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);

    // Efecto para inicializar (CON LA CORRECCIÓN DEL ERROR 500)
    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // --- ARREGLO 1 (Soluciona el error 500) ---
                    // La URL de tu API de Django es 'user/me/', no 'user-data/'
                    const response = await apiClient.get('/auth/user/me/');
                    // Normalizamos el usuario recibido desde el backend
                    const respUser = response.data;
                    const normalizeUser = (u) => {
                        if (!u) return u;
                        const copy = { ...u };
                        // Rol: preferimos copy.rol en la raíz
                        if (!copy.rol && copy.perfil && copy.perfil.rol) {
                            copy.rol = copy.perfil.rol;
                        }
                        //Empleado: unificamos distintos formatos a empleado_id
                        if (!copy.empleado_id) {
                            if (copy.empleado && (copy.empleado.id_empleado || copy.empleado.id)) {
                                copy.empleado_id = copy.empleado.id_empleado || copy.empleado.id;
                            } else if (copy.empleado_id == null && copy.id_empleado) {
                                copy.empleado_id = copy.id_empleado;
                            }
                        }
                        return copy;
                    };
                    const normalized = normalizeUser(respUser);
                    setUser(normalized);
                    try {
                        localStorage.setItem('userData', JSON.stringify(normalized));
                    } catch (e) {
                        console.warn('No se pudo guardar userData en localStorage:', e);
                    }
                } catch (error) {
                    console.error("Token inválido o expirado, cerrando sesión.", error);
                    localStorage.removeItem('authToken');
                    try { localStorage.removeItem('userData'); } catch(e) {}
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    // Función de Login (CON LA CORRECCIÓN DEL TypeError)
   const login = async (username, password) => {
        try {
            
            // A. Hacemos Login
            const response = await apiClient.post('/auth/login/', { username, password });

            const data = response.data;
            const tokenRecibido = data.token || data.access || data.key; // Soporta varios formatos

            if (!tokenRecibido) {
                throw new Error("El servidor no devolvió un token.");
            }

            // B. Guardamos Token
            localStorage.setItem('authToken', tokenRecibido);
            setToken(tokenRecibido);

            // C. OBTENER USUARIO (Aquí es donde explota tu app actual)
            let usuarioFinal = null;

            if (data.user) {
                // Caso 1: El backend ya mandó al usuario
                usuarioFinal = data.user;
            } else {
                // Caso 2: Backend solo mandó token (Django Default). Pedimos el usuario.
                
                // Importante: Pasamos el header manual aquí para asegurar que lo tenga
                const userResp = await apiClient.get('/auth/user/me/', {
                    headers: { 'Authorization': `Token ${tokenRecibido}` } 
                });
                
                usuarioFinal = userResp.data;
            }

            // Normalizamos el objeto usuario para facilitar el uso en la app
            const normalizeUser = (u) => {
                if (!u) return u;
                const copy = { ...u };
                if (!copy.rol && copy.perfil && copy.perfil.rol) {
                    copy.rol = copy.perfil.rol;
                }
                if (!copy.empleado_id) {
                    if (copy.empleado && (copy.empleado.id_empleado || copy.empleado.id)) {
                        copy.empleado_id = copy.empleado.id_empleado || copy.empleado.id;
                    } else if (copy.empleado_id == null && copy.id_empleado) {
                        copy.empleado_id = copy.id_empleado;
                    }
                }
                return copy;
            };

            const usuarioNormalizado = normalizeUser(usuarioFinal);

            // D. Guardamos usuario y terminamos
            setUser(usuarioNormalizado);
            
            // Debug: loguear usuario para verificar estructura
            console.log('Usuario normalizado después de login:', usuarioNormalizado);
            
            try {
                localStorage.setItem('userData', JSON.stringify(usuarioNormalizado));
            } catch (e) {
                console.warn('No se pudo guardar userData en localStorage:', e);
            }
            // Mostrar toast de bienvenida
            try {
                const displayName = usuarioNormalizado?.username || usuarioNormalizado?.email || 'Usuario';
                toast.success(`Bienvenido ${displayName}`);
            } catch (e) {
                console.warn('No se pudo mostrar toast de login:', e);
            }
            return { success: true };

        } catch (error) {
            // Mejor extracción de mensajes de error para distintos formatos de DRF
            const respData = error?.response?.data;

            // Mensajes comunes: detail, non_field_errors, o dict con claves de campo
            let errorMsg = "Error al iniciar sesión";

            if (respData) {
                if (typeof respData === 'string') {
                    const s = respData.trim();
                    // Si el servidor devolvió HTML (traceback o página de error), no mostramos todo en el toast
                    if (s.startsWith('<') || s.toLowerCase().includes('<!doctype') || s.length > 500) {
                        console.error('Server returned HTML or very long error during login:', s);
                        errorMsg = `Error en el servidor (${error.response?.status || '500'})`;
                    } else {
                        errorMsg = s;
                    }
                } else if (respData.detail) {
                    errorMsg = respData.detail;
                } else if (respData.non_field_errors) {
                    errorMsg = Array.isArray(respData.non_field_errors) ? respData.non_field_errors.join(' ') : String(respData.non_field_errors);
                } else {
                    // Si viene un objeto con campos, construimos un mensaje legible
                    try {
                        const parts = [];
                        Object.entries(respData).forEach(([k, v]) => {
                            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
                            else parts.push(`${k}: ${String(v)}`);
                        });
                        if (parts.length) errorMsg = parts.join(' | ');
                    } catch (e) {
                        // Fallback
                        errorMsg = JSON.stringify(respData);
                    }
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            // Logueamos el raw para debugging

            // Mostramos un toast inmediato para notificar al usuario
            try {
                toast.error(errorMsg);
            } catch (e) {
                console.warn('No se pudo mostrar toast:', e);
            }

            // Si falló, limpiamos todo para evitar bucles
            setToken(null);
            setUser(null);
            localStorage.removeItem('authToken');

            return {
                success: false,
                error: errorMsg,
                raw: respData
            };
        }
    };
    
    // Función de Logout (Sin cambios)
    const logout = async () => {
        try {
            await apiClient.post('/auth/logout/');
        } catch (error) {
            console.error("Error en el logout del servidor (se procederá con logout local):", error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            try {
                localStorage.removeItem('userData');
            } catch (e) {
                // ignore
            }
            try {
                toast.success('Sesión cerrada');
            } catch (e) {
                console.warn('No se pudo mostrar toast de logout:', e);
            }
        }
    };

    const contextValue = useMemo(() => ({
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
    }), [user, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
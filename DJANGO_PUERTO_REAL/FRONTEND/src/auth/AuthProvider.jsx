import React, { createContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient';

// 1. Creamos el contexto
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true); // Para saber si estamos inicializando

    // Efecto para inicializar el estado desde localStorage o validar el token existente
    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // Validamos el token pidiendo los datos del usuario
                    const userData = await apiClient('/auth/api/user-data/');
                    setUser(userData);
                } catch (error) {
                    console.error("Token inválido o expirado, cerrando sesión.", error);
                    // Si el token no es válido, lo limpiamos
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]); // Se ejecuta solo cuando el token cambia

    // Función de Login
    const login = async (username, password) => {
        const data = await apiClient('/auth/api/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        // Guardamos el token en localStorage y en el estado
        localStorage.setItem('authToken', data.token);
        setToken(data.token);

        // Guardamos los datos del usuario en el estado
        // El backend nos devuelve { token, user_id, rol }
        setUser({
            id: data.user_id,
            rol: data.rol,
            // Guardamos el empleado_id que ahora nos envía el backend
            empleado_id: data.empleado_id 
        });
    };

    // Función de Logout
    const logout = async () => {
        try {
            await apiClient('/auth/api/logout/', { method: 'POST' });
        } catch (error) {
            console.error("Error en el logout del servidor (se procederá con logout local):", error);
        } finally {
            // Limpiamos todo sin importar si el backend falló
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
        }
    };

    // Usamos useMemo para evitar que el valor del contexto se recalcule en cada render
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
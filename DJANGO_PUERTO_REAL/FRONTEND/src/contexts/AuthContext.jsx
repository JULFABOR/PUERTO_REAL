import React, { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({ token: null, userData: null, isAuthenticated: false });
    const [loading, setLoading] = useState(true); // <-- 1. AÑADIMOS ESTADO DE CARGA
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            setAuthState({
                token,
                userData: JSON.parse(userData),
                isAuthenticated: true,
            });
        }
        setLoading(false); // <-- 2. FINALIZA LA CARGA
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const data = await apiClient('/auth/api/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (data.token && data.rol) {
                const userData = { 
                    email: data.email, 
                    userId: data.user_id, 
                    rol: data.rol,
                    empleado_id: data.empleado_id 
                };

                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                setAuthState({
                    token: data.token,
                    userData: userData,
                    isAuthenticated: true,
                });

                navigate('/home');
                return { success: true };
            }
            return { success: false, error: 'Respuesta inválida del servidor.' };

        } catch (error) {
            console.error('Error detallado en el proceso de login:', error);
            const errorMsg = error.data?.non_field_errors?.[0] || 'Usuario o contraseña incorrectos.';
            return { success: false, error: errorMsg };
        }
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setAuthState({ token: null, userData: null, isAuthenticated: false });
        navigate('/');
    }, [navigate]);

    // --- 3. INCLUIMOS 'loading' EN EL VALOR DEL CONTEXTO ---
    const value = {
        user: authState.userData,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        loading, // <--- AÑADIDO
        login,
        logout,
    };

    // --- 4. NO RENDERIZAMOS NADA MIENTRAS CARGA ---
    if (loading) {
        return null; // O un spinner global
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    return React.useContext(AuthContext);
};
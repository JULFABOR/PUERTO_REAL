import React, { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

const getInitialState = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return {
        token,
        userData: userData ? JSON.parse(userData) : null,
        isAuthenticated: !!token,
    };
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(getInitialState());
    const navigate = useNavigate();

    const login = useCallback(async (username, password) => {
        try {
            const data = await apiClient('/auth/api/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (data.token && data.rol) {
                // ==================================================================
                // --- CORRECCIÓN FINAL ---
                // ==================================================================
                const userData = { 
                    email: data.email, 
                    userId: data.user_id, 
                    rol: data.rol,
                    // Usamos el nombre de campo exacto de la API: 'empleado_id'
                    empleado_id: data.empleado_id 
                };
                // ==================================================================

                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                setAuthState({
                    token: data.token,
                    userData: userData,
                    isAuthenticated: true,
                });

                // --- REACTIVAMOS LA NAVEGACIÓN ---
                if (userData.rol === 'Jefe') {
                    navigate('/jefe/home');
                } else if (userData.rol === 'Empleado') {
                    navigate('/empleado/home');
                } else {
                    navigate('/');
                }

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
        setAuthState({
            token: null,
            userData: null,
            isAuthenticated: false,
        });
        navigate('/');
    }, [navigate]);

    const value = {
        user: authState.userData,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

// Hook personalizado
export const useAuth = () => {
    return React.useContext(AuthContext);
}
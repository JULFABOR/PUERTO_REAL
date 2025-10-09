import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true); // Para saber si se está inicializando
    const navigate = useNavigate();

    // Cargar datos del usuario desde localStorage al iniciar
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');

        if (storedToken && storedUserData) {
            setToken(storedToken);
            setUser(JSON.parse(storedUserData));
        }
        setLoading(false);  
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const data = await apiClient('/auth/api/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            const userData = { 
                email: data.email, 
                userId: data.user_id, 
                rol: data.rol,
                employee_id: data.employee_id
            };

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            setToken(data.token);
            setUser(userData);

            navigate('/home'); // Redirige tras el login exitoso
            return { success: true };

        } catch (error) {
            console.error('Error de login:', error);
            return { success: false, error: 'Nombre de usuario o contraseña incorrectos.' };
        }
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        setToken(null);
        navigate('/'); // Redirige a la página de autenticación
    }, [navigate]);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
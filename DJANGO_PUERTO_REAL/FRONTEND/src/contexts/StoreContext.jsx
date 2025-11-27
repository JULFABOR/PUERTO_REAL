import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/hooks/useAuth';

const StoreContext = createContext(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore debe ser usado dentro de un StoreProvider');
    }
    return context;
};

export const StoreProvider = ({ children }) => {
    const auth = useAuth(); // Obtener el contexto de autenticación completo
    const user = auth ? auth.user : null; // Acceder al usuario de forma segura

    const [storeSettings, setStoreSettings] = useState({
        nombre_tienda: 'Puerto Real',
        direccion: '',
        telefono: '',
    });
    const [loading, setLoading] = useState(true);

    const fetchStoreSettings = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/configuracion/configuracion-tienda/');
            if (response.data) {
                setStoreSettings(response.data);
            }
        } catch (err) {
            console.error("Error cargando la configuración de la tienda para el contexto", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStoreSettings();
        } else {
            setStoreSettings({
                nombre_tienda: 'Puerto Real',
                direccion: '',
                telefono: '',
            });
            setLoading(false);
        }
    }, [user]);

    const updateStoreSettings = (newSettings) => {
        setStoreSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
    };

    const value = {
        storeSettings,
        loading,
        fetchStoreSettings,
        updateStoreSettings,
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

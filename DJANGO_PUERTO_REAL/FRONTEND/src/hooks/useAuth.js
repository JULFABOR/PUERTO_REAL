import { createContext, useContext } from 'react';

// 1. Movimos el Context aquí
export const AuthContext = createContext(null);

// 2. Creamos el hook 'useAuth' aquí para consumir el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};
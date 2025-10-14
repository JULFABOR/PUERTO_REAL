import { useContext } from 'react';
// --- CORRECCIÓN CLAVE AQUÍ ---
// Importamos 'AuthContext' por su nombre, usando llaves {}
import { AuthContext } from '../contexts/AuthContext.jsx';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
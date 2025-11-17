import React, { createContext, useContext, useState} from 'react';
import { useCaja } from '@/hooks/useCaja'; // Importamos el hook que ya tienes

// 1. Creamos el Contexto
const CajaContext = createContext();

// 2. Creamos el Hook para consumir el contexto fácilmente
export const useCajaContext = () => {
    const context = useContext(CajaContext);
    if (!context) {
        throw new Error("useCajaContext debe ser usado dentro de un CajaProvider");
    }
    return context;
};

// 3. Creamos el Proveedor (El componente "Mágico")
export const CajaProvider = ({ children }) => {

    const [selectedDate, setSelectedDate] = useState(new Date());

    // Usamos TU hook 'useCaja' para obtener toda la lógica
    const cajaData = useCaja({ selectedDate });

    // El valor que compartiremos con toda la app
    const value = {
        ...cajaData, // (cashStatus, movements, isSubmitting, etc.)
        selectedDate,       // La fecha seleccionada
        setSelectedDate     // La función para cambiarla
    };

    return (
        <CajaContext.Provider value={value}>
            {children}
        </CajaContext.Provider>
    );
};
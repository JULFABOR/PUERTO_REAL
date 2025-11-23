import React, { createContext, useState } from 'react';
import { useCaja } from '@/hooks/useCaja';

export const CajaContext = createContext(null);

export const CajaProvider = ({ children }) => {

    const [selectedDate, setSelectedDate] = useState(new Date());
    const cajaData = useCaja({ selectedDate });

    const value = {
        ...cajaData,
        selectedDate,
        setSelectedDate
    };

    return (
        <CajaContext.Provider value={value}>
            {children}
        </CajaContext.Provider>
    );
};
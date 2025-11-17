// src/hooks/useCaja.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { toYYYYMMDD } from '@/utils/formatters';

// --- CORRECCIÓN 1: Quitar el 'new Date()' de la firma ---
export const useCaja = ({ poll = false, selectedDate } = {}) => {
    
    // --- CORRECCIÓN 2: Crear una fecha por defecto ESTABLE ---
    // Si no se pasa 'selectedDate' (JefeCaja), usamos esta fecha estable.
    const [defaultDate] = useState(() => new Date());
    
    // Esta es la fecha que realmente usaremos para el fetching.
    // Si 'selectedDate' (del Empleado) existe, se usa. Si no, se usa 'defaultDate'.
    const dateToUse = selectedDate || defaultDate;

    // --- ESTADOS PRINCIPALES ---
    const [cashStatus, setCashStatus] = useState({ 
        isOpen: false, 
        data: null, 
        loading: true, 
        error: null 
    });
    const [movements, setMovements] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FUNCIONES DE FETCHING ---

    const fetchCashStatus = useCallback(async () => {
        if (!cashStatus.loading) {
            setCashStatus(prev => ({ ...prev, loading: true, error: null }));
        }
        try {
            const data = await apiClient('/api/caja/estado/');
            setCashStatus({
                isOpen: data.caja_abierta || false,
                data: data.caja_abierta ? data : (data.ultimo_cierre ? { ultimo_cierre: data.ultimo_cierre } : null),
                loading: false,
                error: null
            });
        } catch (error) {
            console.error("Fetch Cash Status Error:", error);
            const errorMsg = error.message || "Error al obtener estado de la caja.";
            toast.error(errorMsg);
            setCashStatus({ isOpen: false, data: null, loading: false, error: errorMsg });
        }
    }, [cashStatus.loading]);

    
    const fetchMovements = useCallback(async () => {
        setLoadingMovements(true);
        try {
            // --- CORRECCIÓN 3: Usar 'dateToUse' ---
            const dateStr = toYYYYMMDD(dateToUse); 
            const url = poll ? '/api/caja/historial/' : `/api/caja/historial/?date=${dateStr}`;
            
            const data = await apiClient(url);
            
            setMovements(data.movimientos || []);
            setSummary(data.resumen || null);

            if (poll && data.resumen) {
                setCashStatus(prev => {
                    if (prev.isOpen) { 
                        return {
                            ...prev,
                            data: { ...prev.data, resumen: data.resumen }
                        };
                    }
                    return prev; 
                });
            }
        } catch (error) {
            console.error("Fetch Movements Error:", error);
            toast.error("Error al cargar movimientos.");
            setMovements([]);
        } finally {
            setLoadingMovements(false);
        }
    // --- CORRECCIÓN 4: Usar 'dateToUse' en las dependencias ---
    }, [poll, dateToUse]); 

    // --- EFECTOS (CICLO DE VIDA) ---

    // 1. Carga inicial
    useEffect(() => {
        fetchCashStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // 2. Carga MOVIMIENTOS y activa POLLING
    useEffect(() => {
        let intervalId = null;

        if (cashStatus.isOpen) {
            fetchMovements(); // Llama la primera vez

            if (poll) {
                intervalId = setInterval(fetchMovements, 30000); 
            }
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    // Ahora 'fetchMovements' es estable porque 'dateToUse' es estable.
    }, [cashStatus.isOpen, poll, fetchMovements]); 

    // 3. (Para Empleado) Recarga si cambia la fecha
    // Este 'useEffect' ya no existe en el código anterior, lo fusionamos
    // con el de arriba, pero 'dateToUse' maneja esto.
    // ... Ah, no, sí es necesario.
    useEffect(() => {
        // Este SÍ debe re-ejecutarse si 'selectedDate' (el prop) cambia.
        if (poll || !cashStatus.isOpen) return;

        fetchMovements();
    // Usamos 'selectedDate' aquí (el prop) para que se actualice
    // cuando el Empleado cambia el DatePicker.
    // 'fetchMovements' se volverá a crear porque 'dateToUse' cambiará.
    }, [selectedDate, poll, cashStatus.isOpen, fetchMovements]);


    // --- ACCIONES (Abrir, Cerrar, Mover) ---
    const openCaja = async (amount) => {
        if (isSubmitting) return false;
        
        // --- VALIDACIÓN AÑADIDA ---
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            toast.error('El monto inicial debe ser un valor válido (0 o mayor).');
            return false;
        }
        // --- FIN DE VALIDACIÓN ---

        setIsSubmitting(true);
        try {
            await apiClient('/api/caja/abrir/', {
                method: 'POST',
                body: JSON.stringify({ monto_inicial: parsedAmount })
            });
            toast.success('Caja abierta con éxito.');
            await fetchCashStatus(); 
            return true;
        } catch (error) {
            toast.error(error.data?.detail || error.data?.monto_inicial?.[0] || 'No se pudo abrir la caja.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const registerMovement = async (amount, reason, type) => {
        // (Esta función ya tenía la validación, está perfecta)
        if (isSubmitting) return false;
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("El monto debe ser un valor positivo.");
            return false;
        }
        if (!reason || !reason.trim()) {
            toast.error("La descripción/motivo es obligatoria.");
            return false;
        }
        setIsSubmitting(true);
        try {
            await apiClient('/api/caja/movimiento/', {
                method: 'POST',
                body: JSON.stringify({
                    monto: parseFloat(amount),
                    motivo: reason,
                    tipo: type
                })
            });
            toast.success(`Movimiento (${type}) registrado.`);
            await fetchMovements();
            return true;
        } catch (error) {
            toast.error(error.data?.detail || error.data?.monto?.[0] || `No se pudo registrar el ${type.toLowerCase()}.`);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeCaja = async (realBalance) => {
        if (isSubmitting) return false;
        
        // --- VALIDACIÓN AÑADIDA ---
        const parsedRealBalance = parseFloat(realBalance);
        if (realBalance === '' || isNaN(parsedRealBalance) || parsedRealBalance < 0) {
            toast.error('Debes ingresar un Saldo Real Contado válido (0 o mayor).');
            return false;
        }
        // --- FIN DE VALIDACIÓN ---

        setIsSubmitting(true);
        try {
            // Nota: El body que tenías en CloseCajaSection enviaba 'diferencia_caja'.
            // Lo estandarizamos para que solo envíe el 'monto_cierre_real'.
            // El backend debería calcular la diferencia.
            await apiClient('/api/caja/cerrar/', {
                method: 'POST',
                body: JSON.stringify({ monto_cierre_real: parsedRealBalance })
            });
            toast.success('Caja cerrada con éxito.');
            await fetchCashStatus(); 
            setMovements([]); 
            setSummary(null); 
            return true;
        } catch (error) {
            toast.error(error.data?.detail || error.data?.monto_cierre_real?.[0] || 'No se pudo cerrar la caja.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- DATOS DERIVADOS (Cálculos) ---
    const derivedData = useMemo(() => {
        const cashData = cashStatus.data || {};
        const summaryData = (poll ? cashData.resumen : summary) || {};

        const initialBalance = cashData.monto_apertura_caja || summaryData.apertura || 0;
        const cashSales = summaryData.ventas || 0;
        const otherIncome = summaryData.ingresos || 0;
        const cashOutflows = summaryData.egresos || 0;
        
        const totalCashIn = parseFloat(cashSales) + parseFloat(otherIncome);
        const theoreticalBalance = parseFloat(initialBalance) + totalCashIn + parseFloat(cashOutflows);

        return {
            summaryData,
            theoreticalBalance
        };

    }, [cashStatus.data, summary, poll]);

    // --- VALOR DE RETORNO ---
    return {
        cashStatus,
        movements,
        loadingMovements,
        isSubmitting,
        summary: derivedData.summaryData,
        theoreticalBalance: derivedData.theoreticalBalance,
        openCaja,
        registerMovement,
        closeCaja,
        refreshData: () => {
            fetchCashStatus();
            if(cashStatus.isOpen) fetchMovements();
        }
    };
};

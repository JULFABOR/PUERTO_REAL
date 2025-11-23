import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { toYYYYMMDD } from '@/utils/formatters';
import { CajaContext } from '@/contexts/CajaContext';

const getAuthToken = () => localStorage.getItem('authToken');

export const useCaja = ({ poll = false, selectedDate } = {}) => {
    
    const [defaultDate] = useState(() => new Date());
    const dateToUse = selectedDate || defaultDate;

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

    const fetchCashStatus = useCallback(async () => {
        if (!cashStatus.loading) {
            setCashStatus(prev => ({ ...prev, loading: true, error: null }));
        }
        try {
            const response = await apiClient.get('/caja/estado/');
            const data = response.data;
            
            setCashStatus({
                isOpen: data.caja_abierta || false,
                data: data.caja_abierta ? data : (data.ultimo_cierre ? { ultimo_cierre: data.ultimo_cierre } : null),
                loading: false,
                error: null
            });
        } catch (error) {
            console.error("Fetch Cash Status Error:", error);
            const errorMsg = error.response?.data?.detail || "Error al obtener estado de la caja.";
            
            if (error.response?.status !== 401) {
                toast.error(errorMsg);
            }
            setCashStatus({ isOpen: false, data: null, loading: false, error: errorMsg });
        }
    }, [cashStatus.loading]);

    
    const fetchMovements = useCallback(async () => {
        setLoadingMovements(true);
        try {
            const params = {};
            if (!poll) {
                params.date = toYYYYMMDD(dateToUse);
            }
            const response = await apiClient.get('/caja/historial/', { params });
            const data = response.data;

            setMovements(data.movimientos || []);
            setSummary(data.resumen || null);

            if (poll && data.resumen) {
                setCashStatus(prev => {
                    if (prev.isOpen) { 
                        return { ...prev, data: { ...prev.data, resumen: data.resumen } };
                    }
                    return prev; 
                });
            }
        } catch (error) {
            console.error("Fetch Movements Error:", error);
            if (error.response?.status !== 401) {
                toast.error("Error al cargar movimientos.");
            }
            setMovements([]);
        } finally {
            setLoadingMovements(false);
        }
    }, [poll, dateToUse]); 

    useEffect(() => {
        const token = getAuthToken();
        
        if (token) {
            fetchCashStatus();
        } else {
            setCashStatus(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        let intervalId = null;
        if (cashStatus.isOpen) {
            fetchMovements(); 
            if (poll) {
                intervalId = setInterval(fetchMovements, 30000); 
            }
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [cashStatus.isOpen, poll, fetchMovements]); 

    useEffect(() => {
        if (poll || !cashStatus.isOpen) return;
        fetchMovements();
    }, [selectedDate, poll, cashStatus.isOpen, fetchMovements]);

    const openCaja = async (amount) => {
        if (isSubmitting) return false;
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            toast.error('El monto inicial debe ser un valor válido (0 o mayor).');
            return false;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/caja/abrir/', { 
                monto_inicial: parsedAmount 
            });
            toast.success('Caja abierta con éxito.');
            await fetchCashStatus(); 
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.monto_inicial?.[0] || 'No se pudo abrir la caja.';
            toast.error(errorMsg);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const registerMovement = async (amount, reason, type) => {
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
            await apiClient.post('/caja/movimiento/', {
                monto: parseFloat(amount),
                motivo: reason,
                tipo: type
            });
            toast.success(`Movimiento (${type}) registrado.`);
            await fetchMovements();
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.monto?.[0] || `No se pudo registrar el ${type.toLowerCase()}.`;
            toast.error(errorMsg);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeCaja = async (realBalance) => {
        if (isSubmitting) return false;
        const parsedRealBalance = parseFloat(realBalance);
        if (realBalance === '' || isNaN(parsedRealBalance) || parsedRealBalance < 0) {
            toast.error('Debes ingresar un Saldo Real Contado válido (0 o mayor).');
            return false;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/caja/cerrar/', { 
                monto_cierre_real: parsedRealBalance 
            });
            toast.success('Caja cerrada con éxito.');
            await fetchCashStatus(); 
            setMovements([]); 
            setSummary(null); 
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.monto_cierre_real?.[0] || 'No se pudo cerrar la caja.';
            toast.error(errorMsg);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };
    
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

export const useCajaContext = () => {
    const context = useContext(CajaContext);
    if (!context) {
        throw new Error("useCajaContext debe ser usado dentro de un CajaProvider");
    }
    return context;
};

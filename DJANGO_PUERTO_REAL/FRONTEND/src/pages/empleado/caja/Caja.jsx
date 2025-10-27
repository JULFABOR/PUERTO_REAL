import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faStore, 
    faHistory, 
    faDollarSign, 
    faArrowUp,    
    faArrowDown,
    faCalendarDay,
    faSpinner // Añadido para el loading del historial
} from '@fortawesome/free-solid-svg-icons';

// Modales
import CerrarCajaModal from '../../../components/Modals/CerrarCajaModal'; 
import MovimientoCajaModal from '../../../components/Modals/MovimientoCajaModal';

// Helper para formatear la fecha como YYYY-MM-DD
const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Componente helper para las tarjetas de estadísticas
const StatsCard = ({ title, value, icon, colorClass = 'text-pr-yellow' }) => (
    <div className="bg-pr-dark-gray p-4 rounded-lg shadow flex items-center">
        <FontAwesomeIcon icon={icon} className={`text-2xl mr-4 ${colorClass}`} />
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-xl font-bold text-white">${parseFloat(value || 0).toFixed(2)}</p>
        </div>
    </div>
);

const Caja = () => {
    const [cajaEstado, setCajaEstado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [error, setError] = useState(null);
    const [montoInicial, setMontoInicial] = useState('');

    // Estados de Modales
    const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false);
    const [showMovimientoModal, setShowMovimientoModal] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO'); // 'INGRESO' o 'EGRESO'

    // Lógica de Fecha
    const [selectedDate, setSelectedDate] = useState(new Date()); // Inicia hoy
    const [resumenDia, setResumenDia] = useState(null); // Para el Resumen del Día

    // --- Funciones de Carga de Datos ---
    const fetchCajaEstado = async () => {
        try {
            const res = await apiClient('/api/caja/estado/');
            setCajaEstado(res);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchHistorial = useCallback(async (date) => {
        setLoadingHistorial(true);
        setResumenDia(null);
        try {
            const dateStr = toYYYYMMDD(date);
            // Tu API debe devolver: { "movimientos": [lista], "resumen": {objeto} }
            const historialRes = await apiClient(`/api/caja/historial/?date=${dateStr}`);
            
            setHistorial(historialRes.movimientos || []);
            setResumenDia(historialRes.resumen || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingHistorial(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchCajaEstado();
            await fetchHistorial(selectedDate);
            setLoading(false);
        };
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Carga solo una vez al montar

    // Efecto para recargar el historial si la fecha cambia
    useEffect(() => {
        if (!loading) { // No recargar en la carga inicial
            fetchHistorial(selectedDate);
        }
    }, [selectedDate, fetchHistorial, loading]);

    // Handler para el DatePicker
    const handleDateChange = (e) => {
        const dateStr = e.target.value;
        const newDate = new Date(dateStr + 'T00:00:00'); 
        setSelectedDate(newDate);
    };

    const handleAbrirCaja = async () => {
        const monto = parseFloat(montoInicial);
        if (isNaN(monto) || monto <= 0) {
            return toast.error('Por favor, ingrese un monto inicial numérico y mayor a cero.');
        }
        
        const loadingToast = toast.loading('Abriendo caja...');
        try {
            await apiClient('/api/caja/abrir/', {
                method: 'POST',
                body: JSON.stringify({ monto_inicial: monto.toFixed(2) }),
            });
            toast.success('¡Caja abierta con éxito!', { id: loadingToast });
            setMontoInicial('');
            await fetchCajaEstado();
            await fetchHistorial(selectedDate); // Refrescar historial
        } catch (err) {
            toast.error(err.message || 'No se pudo abrir la caja.', { id: loadingToast });
        }
    };

    // Función de refresco genérica
    const refreshData = () => {
        fetchCajaEstado();
        fetchHistorial(selectedDate);
    };

    // Handlers para Ingreso/Egreso
    const handleMovimientoClick = (tipo) => {
        setTipoMovimiento(tipo);
        setShowMovimientoModal(true);
    };

    const getNombreEmpleado = (empleado) => {
        if (!empleado || !empleado.user_empleado) return 'N/A';
        const { first_name, last_name } = empleado.user_empleado;
        return `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
    };

    if (loading) {
        return <p className="text-center text-pr-gray p-10">Cargando estado de la caja...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Control de Caja</h1>

            {error && <p className="text-center text-red-500 bg-red-900/20 p-3 rounded-lg mb-4">Error: {error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- Columna Izquierda (Estado) --- */}
                <div className="lg:col-span-1">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <FontAwesomeIcon icon={faStore} className="mr-3 text-pr-yellow" />
                            Estado Actual
                        </h2>
                        
                        {cajaEstado?.caja_abierta ? (
                            <div className="space-y-4">
                                <p className="text-green-400 font-bold text-lg">Caja Abierta</p>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <StatsCard 
                                        title="Saldo Teórico Total" 
                                        value={cajaEstado?.monto_teorico_caja} 
                                        icon={faDollarSign} 
                                        colorClass="text-green-500" 
                                    />
                                    <StatsCard 
                                        title="Monto Inicial" 
                                        value={cajaEstado?.monto_inicial} 
                                        icon={faDollarSign} 
                                        colorClass="text-gray-400" 
                                    />
                                    <StatsCard 
                                        title="Total Ventas (Efectivo)" 
                                        value={cajaEstado?.total_ventas_efectivo} 
                                        icon={faArrowUp} 
                                        colorClass="text-blue-500" 
                                    />
                                    <StatsCard 
                                        title="Total Egresos" 
                                        value={cajaEstado?.total_egresos} 
                                        icon={faArrowDown} 
                                        colorClass="text-red-500" 
                                    />
                                </div>
                                
                                <div className="text-sm text-pr-gray pt-4 space-y-1 border-t border-gray-700">
                                    <p>Abierta por: {getNombreEmpleado(cajaEstado?.empleado_apertura)}</p>
                                    <p>
                                        Fecha de apertura: {cajaEstado?.fecha_apertura ? new Date(cajaEstado.fecha_apertura).toLocaleString() : 'N/A'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                                    <button 
                                        onClick={() => handleMovimientoClick('INGRESO')}
                                        className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Registrar Ingreso
                                    </button>
                                    <button 
                                        onClick={() => handleMovimientoClick('EGRESO')}
                                        className="bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        Registrar Egreso
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setShowCerrarCajaModal(true)}
                                    className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors mt-4"
                                >
                                    Cerrar Caja
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-red-500 font-bold text-lg">Caja Cerrada</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={montoInicial}
                                        onChange={(e) => setMontoInicial(e.target.value)}
                                        placeholder="Monto inicial"
                                        className="w-full bg-pr-dark-gray border border-gray-700 rounded-lg py-3 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                    />
                                </div>
                                <button 
                                    onClick={handleAbrirCaja}
                                    className="w-full bg-pr-yellow text-pr-dark font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                                >
                                    Abrir Caja
                                </button>
                                {cajaEstado?.ultimo_cierre && (
                                    <p className="text-pr-gray pt-4 text-sm border-t border-gray-700">
                                        Último cierre: {new Date(cajaEstado.ultimo_cierre).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Columna Derecha (Historial) --- */}
                <div className="lg:col-span-2">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <FontAwesomeIcon icon={faHistory} className="mr-3 text-pr-yellow" />
                                Historial de Caja
                            </h2>
                            
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendarDay} className="text-pr-yellow" />
                                <input 
                                    type="date"
                                    value={toYYYYMMDD(selectedDate)}
                                    onChange={handleDateChange}
                                    className="bg-pr-dark-gray border border-gray-700 rounded-lg py-2 px-4 text-white text-lg font-semibold focus:ring-pr-yellow focus:border-pr-yellow"
                                />
                            </div>
                        </div>

                        {loadingHistorial ? (
                            <div className="text-center text-pr-gray p-8">
                                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                <p className="mt-2">Cargando historial...</p>
                            </div>
                        ) : (
                            <>
                                {resumenDia ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <StatsCard title="Apertura" value={resumenDia.apertura} icon={faDollarSign} colorClass="text-gray-400" />
                                        <StatsCard title="Ventas Efectivo" value={resumenDia.ventas} icon={faArrowUp} colorClass="text-blue-500" />
                                        <StatsCard title="Ingresos Man." value={resumenDia.ingresos} icon={faArrowUp} colorClass="text-green-500" />
                                        <StatsCard title="Egresos Man." value={resumenDia.egresos} icon={faArrowDown} colorClass="text-red-500" />
                                    </div>
                                ) : (
                                    !loadingHistorial && <p className="text-center text-gray-500 mb-4">No hay datos de resumen para esta fecha.</p>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-pr-gray">
                                        <thead className="border-b border-gray-700 text-sm text-gray-400 uppercase">
                                            <tr>
                                                <th className="p-4">Fecha</th>
                                                <th className="p-4">Tipo</th>
                                                <th className="p-4">Monto</th>
                                                <th className="p-4">Saldo Anterior</th>
                                                <th className="p-4">Saldo Nuevo</th>
                                                <th className="p-4">Usuario</th>
                                                <th className="p-4">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.length > 0 ? (
                                                historial.map((mov) => (
                                                    <tr key={mov.id_historial_caja} className="border-b border-gray-700 hover:bg-pr-dark-gray">
                                                        <td className="p-4 text-white">{mov.fecha_movimiento_hcaja ? new Date(mov.fecha_movimiento_hcaja).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                                                        <td className="p-4">
                                                            <span className={`font-bold ${['APERTURA', 'INGRESO', 'TRANSFERENCIA_DESDE_FONDO', 'VENTA_EFECTIVO'].includes(mov.tipo_event_caja?.nombre_evento) ? 'text-green-500' : 'text-red-500'}`}>
                                                                {mov.tipo_event_caja?.nombre_evento || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono">${parseFloat(mov.cantidad_movida_hcaja || 0).toFixed(2)}</td>
                                                        <td className="p-4 font-mono">${parseFloat(mov.saldo_anterior_hcaja || 0).toFixed(2)}</td>
                                                        <td className="p-4 font-mono">${parseFloat(mov.nuevo_saldo_hcaja || 0).toFixed(2)}</td>
                                                        <td className="p-4">{getNombreEmpleado(mov.empleado_hc)}</td>
                                                        <td className="p-4 text-sm">{mov.descripcion_hcaja || ''}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center p-8">No hay movimientos en esta fecha.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Renderizado de Modales --- */}
            <CerrarCajaModal
                isOpen={showCerrarCajaModal}
                onClose={() => setShowCerrarCajaModal(false)}
                onSuccess={refreshData}
                cajaEstado={cajaEstado}
            />
            
            <MovimientoCajaModal
                isOpen={showMovimientoModal}
                onClose={() => setShowMovimientoModal(false)}
                onSuccess={refreshData}
                tipoMovimiento={tipoMovimiento}
            />
        </div>
    );
};

export default Caja;
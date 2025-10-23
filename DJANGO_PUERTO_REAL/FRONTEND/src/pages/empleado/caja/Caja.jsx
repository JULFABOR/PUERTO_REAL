import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faHistory, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Helper para formatear la fecha como YYYY-MM-DD
const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Caja = () => {
    const [cajaEstado, setCajaEstado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [montoInicial, setMontoInicial] = useState('');
    const [montoCierreReal, setMontoCierreReal] = useState('');
    const [observacionesCierre, setObservacionesCierre] = useState('');

    // State para la paginación por fecha
    const [availableDates, setAvailableDates] = useState([]);
    const [currentDateIndex, setCurrentDateIndex] = useState(0);

    const fetchCajaEstado = async () => {
        try {
            const res = await apiClient('/api/caja/estado/');
            setCajaEstado(res);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchHistorial = useCallback(async (date) => {
        setLoading(true);
        try {
            const dateStr = toYYYYMMDD(date);
            const historialRes = await apiClient(`/api/caja/historial/?date=${dateStr}`);
            setHistorial(historialRes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAvailableDates = async () => {
        try {
            const datesRes = await apiClient('/api/caja/historial/dates/');
            if (datesRes.length > 0) {
                setAvailableDates(datesRes);
                fetchHistorial(new Date(datesRes[0])); // Cargar historial de la fecha más reciente
            } else {
                // Si no hay fechas, cargar el historial para hoy (que estará vacío)
                fetchHistorial(new Date());
            }
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchCajaEstado();
        fetchAvailableDates();
    }, [fetchHistorial]);

    const handleDateChange = (newIndex) => {
        if (newIndex >= 0 && newIndex < availableDates.length) {
            setCurrentDateIndex(newIndex);
            // Las fechas de la API vienen como YYYY-MM-DD, necesitamos ajustar la zona horaria para evitar errores de un día
            const date = new Date(availableDates[newIndex] + 'T00:00:00');
            fetchHistorial(date);
        }
    };

    const handleAbrirCaja = async () => {
        const monto = parseFloat(montoInicial);
        if (isNaN(monto) || monto <= 0) {
            alert('Por favor, ingrese un monto inicial numérico y mayor a cero.');
            return;
        }
        try {
            await apiClient('/api/caja/abrir/', {
                method: 'POST',
                body: JSON.stringify({ monto_inicial: monto.toFixed(2) }),
            });
            setMontoInicial('');
            await fetchCajaEstado();
            await fetchAvailableDates();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCerrarCaja = async () => {
        if (!montoCierreReal || parseFloat(montoCierreReal) <= 0) {
            alert('Por favor, ingrese un monto de cierre válido y positivo.');
            return;
        }
        if (!window.confirm('¿Está seguro de que desea cerrar la caja? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            await apiClient('/api/caja/cerrar/', {
                method: 'POST',
                body: JSON.stringify({
                    monto_cierre_real: montoCierreReal,
                    observaciones_cierre: observacionesCierre
                }),
            });
            setMontoCierreReal('');
            setObservacionesCierre('');
            await fetchCajaEstado();
            await fetchAvailableDates();
        } catch (err) {
            setError(err.message);
        }
    };

    const getNombreEmpleado = (empleado) => {
        if (!empleado || !empleado.user_empleado) return 'N/A';
        const { first_name, last_name } = empleado.user_empleado;
        return `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
    };

    const selectedDate = availableDates[currentDateIndex] ? new Date(availableDates[currentDateIndex] + 'T00:00:00') : new Date();

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Control de Caja</h1>

            {error && <p className="text-center text-red-500 bg-red-900/20 p-3 rounded-lg mb-4">Error: {error}</p>}

            {/* Estado de Caja y Acciones */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FontAwesomeIcon icon={faStore} className="mr-3 text-pr-yellow" />
                    Estado Actual
                </h2>
                {cajaEstado?.caja_abierta ? (
                    <div className="space-y-4">
                        <p className="text-green-400 font-bold text-lg">Caja Abierta</p>
                        <p className="text-white text-2xl font-mono">
                            ${parseFloat(cajaEstado?.monto_teorico_caja || 0).toFixed(2)}
                        </p>
                        <p className="text-pr-gray">Abierta por: {getNombreEmpleado(cajaEstado?.empleado_apertura)}</p>
                        <p className="text-pr-gray">
                            Fecha de apertura: {cajaEstado?.fecha_apertura ? new Date(cajaEstado.fecha_apertura).toLocaleString() : 'N/A'}
                        </p>
                        <div className="mt-4 space-y-4">
                            <input
                                type="number"
                                value={montoCierreReal}
                                onChange={(e) => setMontoCierreReal(e.target.value)}
                                placeholder="Monto de cierre real"
                                className="bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white w-full focus:ring-pr-yellow focus:border-pr-yellow"
                            />
                            <textarea
                                value={observacionesCierre}
                                onChange={(e) => setObservacionesCierre(e.target.value)}
                                placeholder="Observaciones de cierre (opcional)"
                                className="bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white w-full focus:ring-pr-yellow focus:border-pr-yellow"
                                rows="3"
                            ></textarea>
                        </div>
                        <button 
                            onClick={handleCerrarCaja}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
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
                                className="bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                            />
                            <button 
                                onClick={handleAbrirCaja}
                                className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                            >
                                Abrir Caja
                            </button>
                        </div>
                         {cajaEstado?.ultimo_cierre && (
                            <p className="text-pr-gray pt-4">Último cierre: {new Date(cajaEstado.ultimo_cierre).toLocaleString()}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Historial de Movimientos */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FontAwesomeIcon icon={faHistory} className="mr-3 text-pr-yellow" />
                        Historial de Caja
                    </h2>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => handleDateChange(currentDateIndex + 1)}
                            disabled={currentDateIndex >= availableDates.length - 1}
                            className="bg-pr-gray/20 text-white font-bold p-2 rounded-lg hover:bg-pr-gray/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span className="text-white font-semibold text-lg">
                            {selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <button 
                            onClick={() => handleDateChange(currentDateIndex - 1)}
                            disabled={currentDateIndex <= 0}
                            className="bg-pr-gray/20 text-white font-bold p-2 rounded-lg hover:bg-pr-gray/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="text-center text-pr-gray p-8">Cargando historial...</p>
                    ) : (
                        <table className="w-full text-left text-pr-gray">
                            <thead className="border-b border-pr-gray/20">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Monto Movido</th>
                                    <th className="p-4">Saldo Anterior</th>
                                    <th className="p-4">Saldo Nuevo</th>
                                    <th className="p-4">Usuario</th>
                                    <th className="p-4">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.length > 0 ? (
                                    historial.map((mov) => (
                                    <tr key={mov.id_historial_caja} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                        <td className="p-4 text-white">{mov.fecha_movimiento_hcaja ? new Date(mov.fecha_movimiento_hcaja).toLocaleString() : 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`font-bold ${['APERTURA', 'INGRESO', 'TRANSFERENCIA_DESDE_FONDO'].includes(mov.tipo_event_caja?.nombre_evento) ? 'text-green-500' : 'text-red-500'}`}>
                                                {mov.tipo_event_caja?.nombre_evento || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">${parseFloat(mov.cantidad_movida_hcaja || 0).toFixed(2)}</td>
                                        <td className="p-4 font-mono">${parseFloat(mov.saldo_anterior_hcaja || 0).toFixed(2)}</td>
                                        <td className="p-4 font-mono">${parseFloat(mov.nuevo_saldo_hcaja || 0).toFixed(2)}</td>
                                        <td className="p-4">{getNombreEmpleado(mov.empleado_hc)}</td>
                                        <td className="p-4">{mov.descripcion_hcaja || ''}</td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center p-8">No hay movimientos en esta fecha.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Caja;
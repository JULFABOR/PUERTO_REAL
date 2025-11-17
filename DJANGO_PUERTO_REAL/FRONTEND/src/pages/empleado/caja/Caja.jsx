import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faStore, faHistory, faDollarSign, faArrowUp, faArrowDown,
    faCalendarDay, faSpinner, faUser 
} from '@fortawesome/free-solid-svg-icons';

// --- ¡CAMBIOS CLAVE EN IMPORTS! ---
import { useCajaContext } from '@/contexts/CajaContext';
// Añadimos 'isToday'
import { formatCurrency, toYYYYMMDD, isToday } from '@/utils/formatters'; 
import FormInput from '@/components/shared/FormInput'; 
import MovimientoCajaModal from '@/components/Modals/MovimientoCajaModal';
import CloseCajaSection from '@/components/Modals/CloseCajaSection'; 

// --- HELPERS GLOBALES ---
// (Componentes de ayuda para renderizar)

const getTipoColorClass = (tipoNombre) => {
    const positiveTypes = [
        'APERTURA', 'INGRESO_MANUAL', 'TRANSFERENCIA_DESDE_FONDO', 'VENTA_EFECTIVO'
    ];
    if (!tipoNombre) return 'text-gray-400';
    return positiveTypes.includes(tipoNombre) ? 'text-green-500' : 'text-red-500';
};

const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('es-ES', { 
        hour: '2-digit', minute: '2-digit', hour12: false
    });
};

const StatsCard = ({ title, value, icon, colorClass = 'text-pr-yellow' }) => (
    <div className="bg-pr-dark-gray p-4 rounded-lg shadow flex items-center">
        <FontAwesomeIcon icon={icon} className={`text-2xl mr-4 ${colorClass}`} />
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(value)}</p>
        </div>
    </div>
);

const getNombreEmpleado = (empleado) => {
    if (!empleado || !empleado.user_empleado) return 'N/A';
    const { first_name, last_name } = empleado.user_empleado;
    return `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
};

const MovementRow = ({ mov }) => {
    const tipoNombre = mov.tipo_event_caja?.nombre_evento || 'N/A';
    return (
        <tr className="border-b border-gray-700 hover:bg-pr-dark-gray">
            <td className="p-4 text-white">
                {formatTime(mov.fecha_movimiento_hcaja)}
            </td>
            <td className="p-4">
                <span className={`font-bold ${getTipoColorClass(tipoNombre)}`}>
                    {tipoNombre}
                </span>
            </td>
            <td className="p-4 font-mono text-right">{formatCurrency(mov.cantidad_movida_hcaja)}</td>
            <td className="p-4 font-mono text-right">{formatCurrency(mov.saldo_anterior_hcaja)}</td>
            <td className="p-4 font-mono text-right">{formatCurrency(mov.nuevo_saldo_hcaja)}</td>
            <td className="p-4">{getNombreEmpleado(mov.empleado_hc)}</td>
            <td className="p-4 text-sm truncate max-w-xs" title={mov.descripcion_hcaja || ''}>
                {mov.descripcion_hcaja || ''}
            </td>
        </tr>
    );
};

const MovementCard = ({ mov }) => {
    const tipoNombre = mov.tipo_event_caja?.nombre_evento || 'N/A';
    const colorClass = getTipoColorClass(tipoNombre);
    return (
        <div className="bg-pr-dark-gray p-4 rounded-lg shadow mb-3">
            <div className="flex justify-between items-center mb-2">
                <span className={`font-bold text-lg ${colorClass}`}>{tipoNombre}</span>
                <span className={`font-mono text-lg font-bold ${colorClass}`}>{formatCurrency(mov.cantidad_movida_hcaja)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mb-3 pb-3 border-b border-gray-700">
                <span className="flex items-center gap-2"><FontAwesomeIcon icon={faCalendarDay} />{formatTime(mov.fecha_movimiento_hcaja)}</span>
                <span className="flex items-center gap-2"><FontAwesomeIcon icon={faUser} />{getNombreEmpleado(mov.empleado_hc)}</span>
            </div>
            {mov.descripcion_hcaja && (
                <p className="text-sm text-gray-300"><span className="font-bold">Notas:</span> {mov.descripcion_hcaja}</p>
            )}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (CAJA EMPLEADO) ---
const Caja = () => {
    // --- ESTADO LOCAL DE UI ---
    const [montoInicial, setMontoInicial] = useState('');
    const [showMovimientoModal, setShowMovimientoModal] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO');

    // --- DATOS DEL CONTEXTO ---
    const {
        cashStatus, movements, loadingMovements, isSubmitting, summary, 
        openCaja, registerMovement, closeCaja,
        selectedDate, setSelectedDate // <-- Vienen del contexto
    } = useCajaContext();
    
    // --- LÓGICA DE UI MEJORADA ---
    // Determinamos si mostramos la columna de "Estado del Día" (solo para HOY)
    const showCurrentStatus = isToday(selectedDate);
    // ----------------------------

    // --- HANDLERS ---
    const handleDateChange = (e) => {
        const dateStr = e.target.value;
        const newDate = new Date(dateStr + 'T00:00:00'); 
        setSelectedDate(newDate); // <-- Llama a la función del contexto
    };

    const handleAbrirCaja = async () => {
        const monto = parseFloat(montoInicial);
        if (isNaN(monto) || monto < 0) {
            return toast.error('Por favor, ingrese un monto inicial válido (0 o mayor).');
        }
        const success = await openCaja(monto); 
        if (success) setMontoInicial('');
    };

    const handleMovimientoClick = (tipo) => {
        setTipoMovimiento(tipo);
        setShowMovimientoModal(true);
    };

    // --- RENDER ---
    if (cashStatus.loading) {
        return (
            <div className="flex justify-center items-center h-64 text-pr-yellow">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
            </div>
        );
    }

    const fullDateFormatOptions = { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Control de Caja</h1>

            {cashStatus.error && <p className="text-center text-red-500 bg-red-900/20 p-3 rounded-lg mb-4">Error: {cashStatus.error}</p>}

            {/* --- DIV PRINCIPAL MODIFICADO --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- 1. COLUMNA IZQUIERDA (Estado) - CONDICIONAL --- */}
                {/* Solo se muestra si la fecha seleccionada es HOY */}
                {showCurrentStatus && (
                    <div className="lg:col-span-1">
                        <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                                <FontAwesomeIcon icon={faStore} className="mr-3 text-pr-yellow" />
                                Estado del Día
                            </h2>
                            
                            {cashStatus.isOpen ? (
                                // --- VISTA: CAJA ABIERTA ---
                                <div className="space-y-4">
                                    <p className="text-green-400 font-bold text-lg">Caja Abierta</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <StatsCard title="Saldo Teórico Total" value={cashStatus.data?.monto_teorico_caja} icon={faDollarSign} colorClass="text-green-500" />
                                        <StatsCard title="Monto Inicial" value={cashStatus.data?.monto_inicial} icon={faDollarSign} colorClass="text-gray-400" />
                                        <StatsCard title="Total Ventas (Efectivo)" value={cashStatus.data?.total_ventas_efectivo} icon={faArrowUp} colorClass="text-blue-500" />
                                        <StatsCard title="Total Egresos" value={cashStatus.data?.total_egresos} icon={faArrowDown} colorClass="text-red-500" />
                                    </div>
                                    <div className="text-sm text-pr-gray pt-4 space-y-1 border-t border-gray-700">
                                        <p>Abierta por: {getNombreEmpleado(cashStatus.data?.empleado_apertura)}</p>
                                        <p>
                                            Fecha de apertura: {cashStatus.data?.fecha_apertura 
                                                ? new Date(cashStatus.data.fecha_apertura).toLocaleString('es-ES', fullDateFormatOptions) 
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                                        <button onClick={() => handleMovimientoClick('INGRESO')} className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                            Registrar Ingreso
                                        </button>
                                        <button onClick={() => handleMovimientoClick('EGRESO')} className="bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                                            Registrar Egreso
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // --- VISTA: CAJA CERRADA ---
                                <div className="space-y-4">
                                    <p className="text-red-500 font-bold text-lg">Caja Cerrada</p>
                                    <FormInput
                                        name="initial_balance_empleado" label="Monto Inicial en Efectivo"
                                        type="number" step="0.01" min="0" value={montoInicial}
                                        onChange={(e) => setMontoInicial(e.target.value)} required disabled={isSubmitting} 
                                    />
                                    <button onClick={handleAbrirCaja} disabled={isSubmitting} className="w-full bg-pr-yellow text-pr-dark font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed">
                                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Abrir Caja'}
                                    </button>
                                    {cashStatus.data?.ultimo_cierre && (
                                        <p className="text-pr-gray pt-4 text-sm border-t border-gray-700">
                                            Último cierre: {new Date(cashStatus.data.ultimo_cierre).toLocaleString('es-ES', fullDateFormatOptions)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 2. COLUMNA DERECHA (Historial) - TAMAÑO DINÁMICO --- */}
                {/* Ocupa 2 columnas si el estado es visible, o 3 si está oculto */}
                <div className={showCurrentStatus ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <FontAwesomeIcon icon={faHistory} className="mr-3 text-pr-yellow" />
                                Historial de Caja
                            </h2>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendarDay} className="text-pr-yellow" />
                                <input 
                                    type="date" value={toYYYYMMDD(selectedDate)} onChange={handleDateChange}
                                    max={toYYYYMMDD(new Date())}
                                    className="bg-pr-dark-gray border border-gray-700 rounded-lg py-2 px-4 text-white text-lg font-semibold focus:ring-pr-yellow focus:border-pr-yellow"
                                />
                            </div>
                        </div>

                        {loadingMovements ? (
                            <div className="text-center text-pr-gray p-8">
                                <FontAwesomeIcon icon={faSpinner} spin size="2x" /><p className="mt-2">Cargando historial...</p>
                            </div>
                        ) : (
                            <>
                                {summary ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <StatsCard title="Apertura" value={summary.apertura} icon={faDollarSign} colorClass="text-gray-400" />
                                        <StatsCard title="Ventas Efectivo" value={summary.ventas} icon={faArrowUp} colorClass="text-blue-500" />
                                        <StatsCard title="Ingresos Man." value={summary.ingresos} icon={faArrowUp} colorClass="text-green-500" />
                                        <StatsCard title="Egresos Man." value={summary.egresos} icon={faArrowDown} colorClass="text-red-500" />
                                    </div>
                                ) : (!loadingMovements && <p className="text-center text-gray-500 mb-4">No hay datos de resumen para esta fecha.</p>)}

                                {/* VISTA MÓVIL (Tarjetas) */}
                                <div className="lg:hidden">
                                    {movements.length > 0 ? (
                                        movements.map((mov) => <MovementCard key={mov.id_historial_caja} mov={mov} />)
                                    ) : (
                                        <div className="text-center p-8 text-pr-gray">No hay movimientos en esta fecha.</div>
                                    )}
                                </div>

                                {/* VISTA DESKTOP (Tabla) */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full text-left text-pr-gray">
                                        <thead className="border-b border-gray-700 text-sm text-gray-400 uppercase">
                                            <tr>
                                                <th className="p-4">Hora</th>
                                                <th className="p-4">Tipo</th>
                                                <th className="p-4 text-right">Monto</th>
                                                <th className="p-4 text-right">Saldo Anterior</th>
                                                <th className="p-4 text-right">Saldo Nuevo</th>
                                                <th className="p-4">Usuario</th>
                                                <th className="p-4">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movements.length > 0 ? (
                                                movements.map((mov) => <MovementRow key={mov.id_historial_caja} mov={mov} />)
                                            ) : (
                                                <tr><td colSpan="7" className="text-center p-8">No hay movimientos en esta fecha.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* --- MODALES Y SECCIONES (LIMPIADOS) --- */}
            
            {/* El 'CloseCajaSection' también es condicional a 'showCurrentStatus' */}
            {showCurrentStatus && cashStatus.isOpen && (
                <CloseCajaSection
                    cajaEstado={cashStatus.data} 
                    // Prop 'onSuccess' eliminada (redundante)
                    closeCaja={closeCaja} 
                    isSubmitting={isSubmitting}
                />
            )}
            
            <MovimientoCajaModal
                isOpen={showMovimientoModal} 
                onClose={() => setShowMovimientoModal(false)}
                // Prop 'onSuccess' eliminada (redundante)
                tipoMovimiento={tipoMovimiento}
                registerMovement={registerMovement} 
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default Caja;
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDoorOpen, faPlus, faMinus, faDoorClosed, faCashRegister,
    faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// --- IMPORTS DE PASOS ANTERIORES ---
import { useCaja } from '@/hooks/useCaja';
import { formatCurrency } from '@/utils/formatters';
import FormInput from '@/components/shared/FormInput'; 
import OpenCajaModal from '@/components/Modals/OpenCajaModal'; // <-- ¡Nombre corregido!
import MovimientoCajaModal from '@/components/Modals/MovimientoCajaModal'; // <-- Reutilizado

// --- Componentes Internos de UI (Helpers de Render) ---
const SummaryCard = ({ title, value, colorClass = 'text-white', isMain = false }) => (
    <div className={`bg-pr-dark p-4 rounded-lg shadow border ${isMain ? 'border-2 border-pr-yellow' : 'border-pr-gray/20'}`}>
        <p className="text-sm text-pr-gray mb-1">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const getMovementBadgeClass = (tipoEvento) => {
    const typeLower = tipoEvento?.nombre_evento?.toLowerCase() || '';
    if (typeLower.includes('apertura')) return 'bg-blue-600/20 text-blue-300';
    if (typeLower.includes('ingreso')) return 'bg-green-600/20 text-green-300';
    if (typeLower.includes('venta')) return 'bg-teal-600/20 text-teal-300';
    if (typeLower.includes('egreso') || typeLower.includes('retiro')) return 'bg-red-600/20 text-red-300';
    return 'bg-gray-700 text-gray-300';
};

// --- Componente Principal ---

const JefeCaja = () => {
    
    // --- LÓGICA DE DATOS (TODA VIENE DEL HOOK) ---
    const {
        cashStatus,
        movements,
        loadingMovements,
        isSubmitting,
        summary,
        theoreticalBalance,
        openCaja,
        registerMovement,
        closeCaja
    } = useCaja({ poll: true }); // Activamos el Polling

    // --- ESTADO LOCAL DE UI (Solo modales y formulario de cierre) ---
    const [showOpenCajaModal, setShowOpenCajaModal] = useState(false); // Nombre actualizado
    const [showMovementModal, setShowMovementModal] = useState({ show: false, type: 'INGRESO' });
    const [realBalance, setRealBalance] = useState(''); // Input de cierre

    // --- CÁLCULOS DE UI ---
    const difference = realBalance !== '' ? parseFloat(realBalance) - theoreticalBalance : null;
    
    const getDifferenceClass = () => {
        if (difference === null || difference === 0) return 'text-white';
        return difference < 0 ? 'text-red-400' : 'text-green-400';
    };

    // --- HANDLERS (Simplificados para llamar al hook) ---
    
    const handleOpenSubmit = async (amount) => {
        const success = await openCaja(amount); // El hook valida
        if (success) {
            setShowOpenCajaModal(false);
        }
    };

    // Este handler ahora es para el modal reutilizable
    const handleMovementSubmit = async (monto, motivo) => {
        const success = await registerMovement(monto, motivo, showMovementModal.type);
        if (success) {
            setShowMovementModal({ show: false, type: 'INGRESO' });
        }
    };

    const handleCloseSubmit = async () => {
        const success = await closeCaja(parseFloat(realBalance)); // El hook valida
        if (success) {
            setRealBalance(''); // Limpia el input al cerrar
        }
    };

    // --- RENDER ---
    
    if (cashStatus.loading) {
        return <div className="flex justify-center items-center h-64 text-pr-yellow"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" /></div>;
    }

    if (cashStatus.error && !cashStatus.isOpen) {
        return (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                <div>
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{cashStatus.error}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ======================= VIEW: CASH CLOSED ======================= */}
            {!cashStatus.isOpen ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center p-6 bg-pr-dark rounded-lg border border-pr-gray/20">
                    <FontAwesomeIcon icon={faCashRegister} className="text-pr-gray/40 text-6xl mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-4">La caja está cerrada</h1>
                    <p className="text-pr-gray mb-8 max-w-md">Para comenzar a registrar movimientos, realiza la apertura de caja con el saldo inicial.</p>
                    <button
                        onClick={() => setShowOpenCajaModal(true)} // Nombre actualizado
                        className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-lg px-8 py-3 text-center flex items-center justify-center gap-3 mx-auto transition-colors"
                    >
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Abrir Caja</span>
                    </button>
                </div>
            ) : (
            /* ======================= VIEW: CASH OPEN ======================= */
                <div>
                    {/* --- Header --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Control de Caja</h1>
                            <p className="text-pr-gray">Fecha: <span className="font-semibold text-white">{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </div>
                    </div>

                    {/* --- Cash Summary Cards (Datos del Hook) --- */}
                    <h2 className="text-2xl font-bold text-white mb-4">Resumen de Efectivo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <SummaryCard title="Saldo Inicial" value={formatCurrency(summary.apertura || cashStatus.data?.monto_apertura_caja)} />
                        <SummaryCard title="Ingresos Efectivo" value={formatCurrency(parseFloat(summary.ventas || 0) + parseFloat(summary.ingresos || 0), '+')} colorClass="text-green-400" />
                        <SummaryCard title="Egresos Efectivo" value={formatCurrency(summary.egresos || 0)} colorClass="text-red-400" />
                        <SummaryCard title="Saldo Teórico (Efectivo)" value={formatCurrency(theoreticalBalance)} colorClass="text-pr-yellow" isMain={true} />
                    </div>

                    {/* --- Action Buttons --- */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button onClick={() => setShowMovementModal({ show: true, type: 'INGRESO' })} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors">
                            <FontAwesomeIcon icon={faPlus} /><span>Registrar Ingreso</span>
                        </button>
                        <button onClick={() => setShowMovementModal({ show: true, type: 'EGRESO' })} className="w-full sm:w-auto text-white bg-gray-600 hover:bg-gray-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors">
                            <FontAwesomeIcon icon={faMinus} /><span>Registrar Egreso</span>
                        </button>
                    </div>

                    {/* --- Recent Movements Table (Datos del Hook) --- */}
                    <h2 className="text-2xl font-bold text-white mb-4">Últimos Movimientos en Efectivo</h2>
                    <div className="relative overflow-x-auto shadow-md rounded-lg max-h-96 overflow-y-auto border border-pr-gray/20">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-white uppercase bg-pr-dark sticky top-0 z-10 border-b border-pr-gray/20">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Hora</th>
                                    <th scope="col" className="px-6 py-3">Tipo</th>
                                    <th scope="col" className="px-6 py-3 hidden sm:table-cell">Descripción</th>
                                    <th scope="col" className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loadingMovements ? (
                                    <tr><td colSpan="4" className="text-center py-8"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-pr-yellow text-2xl"/></td></tr>
                                ) : movements.length > 0 ? (
                                    movements.map((mov) => (
                                        <tr key={mov.id_historial_caja} className="bg-pr-dark-gray hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap">{new Date(mov.fecha_movimiento_hcaja).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-6 py-3"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${getMovementBadgeClass(mov.tipo_event_caja)}`}>{mov.tipo_event_caja?.nombre_evento || 'N/A'}</span></td>
                                            <td className="px-6 py-3 hidden sm:table-cell">{mov.descripcion_hcaja || '-'}</td>
                                            <td className={`px-6 py-3 text-right font-medium ${parseFloat(mov.cantidad_movida_hcaja) < 0 ? 'text-red-400' : 'text-white'}`}>
                                                {formatCurrency(mov.cantidad_movida_hcaja)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="text-center py-8 text-pr-gray">No hay movimientos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Cash Closing Section (Datos del Hook) --- */}
                    <div className="mt-12 bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                        <h2 className="text-2xl font-bold text-white mb-6">Cierre y Arqueo de Caja</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <FormInput
                                name="real_balance"
                                label="Saldo Real Contado (Efectivo) *"
                                type="number" step="0.01" min="0"
                                value={realBalance}
                                onChange={(e) => setRealBalance(e.target.value)}
                                disabled={isSubmitting}
                            />
                            
                            <div className="text-center md:pb-1">
                                <p className="text-sm text-pr-gray">Diferencia</p>
                                <p className={`text-2xl font-bold ${getDifferenceClass()}`}>
                                    {difference === null ? '-' : formatCurrency(difference)}
                                </p>
                            </div>
                            
                            <button
                                onClick={handleCloseSubmit}
                                disabled={realBalance === '' || isSubmitting || isNaN(parseFloat(realBalance))}
                                className="w-full text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center gap-2 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faDoorClosed} />}
                                <span>{isSubmitting ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <OpenCajaModal
                isOpen={showOpenCajaModal} // Nombre actualizado
                onClose={() => setShowOpenCajaModal(false)}
                onSubmit={handleOpenSubmit}
                isSubmitting={isSubmitting}
            />

            <MovimientoCajaModal
                isOpen={showMovementModal.show}
                onClose={() => setShowMovementModal({ show: false, type: 'INGRESO' })}
                onSuccess={() => {
                    // El hook 'registerMovement' ya refresca los datos (con fetchMovements)
                    // No es necesario llamar a refreshData() aquí, solo cerrar.
                    setShowMovementModal({ show: false, type: 'INGRESO' });
                }}
                tipoMovimiento={showMovementModal.type}
                registerMovement={handleMovementSubmit} // Pasamos el handler que llama al hook
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default JefeCaja;
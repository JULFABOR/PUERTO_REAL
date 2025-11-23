import { useState } from 'react';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDoorOpen, faPlus, faMinus, faDoorClosed, faCashRegister,
    faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// --- IMPORTS DE PASOS ANTERIORES ---
import { useCaja } from '@/hooks/useCaja';
import { formatCurrency } from '@/utils/formatters';
import FormInput from '@/components/shared/FormInput'; 
import OpenCajaModal from '@/components/Modals/Caja/OpenCajaModal';
import MovimientoCajaModal from '@/components/Modals/Caja/MovimientoCajaModal';

// --- Componentes Internos de UI (Helpers de Render) ---
const SummaryCard = ({ title, value, colorClass = 'text-white', isMain = false }) => (
    <div className={`bg-pr-dark p-4 rounded-lg shadow-lg border ${isMain ? 'border-2 border-pr-yellow' : 'border-pr-gray/20'}`}>
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
    } = useCaja({ poll: true });

    // --- ESTADO LOCAL DE UI ---
    const [showOpenCajaModal, setShowOpenCajaModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState({ show: false, type: 'INGRESO' });
    const [realBalance, setRealBalance] = useState('');
    const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false);

    // --- CÁLCULOS DE UI ---
    const difference = realBalance !== '' ? parseFloat(realBalance) - theoreticalBalance : null;
    const differenceClass = difference === null || difference === 0 ? 'text-white' : difference < 0 ? 'text-red-400' : 'text-green-400';
    
    // --- HANDLERS ---
    const handleOpenSubmit = async (amount) => {
        const success = await openCaja(amount);
        if (success) setShowOpenCajaModal(false);
    };

    const handleMovementSuccess = () => {
        setShowMovementModal({ show: false, type: 'INGRESO' });
    };

    const handleCloseSubmit = () => setShowConfirmCloseModal(true);

    const confirmCloseCaja = async () => {
        const success = await closeCaja(parseFloat(realBalance));
        if (success) setRealBalance('');
        setShowConfirmCloseModal(false);
    };

    // --- RENDER ---
    if (cashStatus.loading) {
        return <div className="flex justify-center items-center h-64 text-pr-yellow"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" /></div>;
    }

    if (cashStatus.error && !cashStatus.isOpen) {
        return (
            <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center" role="alert">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3" />
                <div><strong>Error:</strong> <span className="ml-2">{cashStatus.error}</span></div>
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
                    <button onClick={() => setShowOpenCajaModal(true)} className="btn-primary-lg mx-auto">
                        <FontAwesomeIcon icon={faDoorOpen} /><span>Abrir Caja</span>
                    </button>
                </div>
            ) : (
            /* ======================= VIEW: CASH OPEN ======================= */
                <div className="bg-pr-dark-gray p-6 rounded-lg shadow-lg">
                    {/* --- Header --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Panel de Control de Caja</h1>
                            <p className="text-pr-gray">Caja Abierta - <span className="font-semibold text-white">{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </div>
                        <div className="flex gap-4 mt-4 sm:mt-0">
                            <button onClick={() => setShowMovementModal({ show: true, type: 'INGRESO' })} className="btn-primary">
                                <FontAwesomeIcon icon={faPlus} /><span>Ingreso</span>
                            </button>
                            <button onClick={() => setShowMovementModal({ show: true, type: 'EGRESO' })} className="btn-secondary">
                                <FontAwesomeIcon icon={faMinus} /><span>Egreso</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* --- Main Content Grid --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* --- Left Column: Summary & Closing --- */}
                        <div className="lg:col-span-1 flex flex-col gap-8">
                            {/* Cash Summary */}
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                                <h2 className="text-xl font-bold text-white mb-4">Resumen de Efectivo</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <SummaryCard title="Saldo Inicial" value={formatCurrency(summary.apertura || cashStatus.data?.monto_apertura_caja)} />
                                    <SummaryCard title="Ingresos" value={formatCurrency(parseFloat(summary.ventas || 0) + parseFloat(summary.ingresos || 0), '+')} colorClass="text-green-400" />
                                    <SummaryCard title="Egresos" value={formatCurrency(summary.egresos || 0)} colorClass="text-red-400" />
                                    <SummaryCard title="Saldo Teórico" value={formatCurrency(theoreticalBalance)} colorClass="text-pr-yellow" isMain={true} />
                                </div>
                            </div>

                            {/* Cash Closing */}
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                                <h2 className="text-xl font-bold text-white mb-6">Cierre y Arqueo de Caja</h2>
                                <div className="flex flex-col gap-4">
                                    <FormInput name="real_balance" label="Saldo Real Contado (Efectivo) *" type="number" step="0.01" min="0" value={realBalance} onChange={(e) => setRealBalance(e.target.value)} disabled={isSubmitting} />
                                    <div className="text-center">
                                        <p className="text-sm text-pr-gray">Diferencia</p>
                                        <p className={`text-2xl font-bold ${differenceClass}`}>{difference === null ? '-' : formatCurrency(difference)}</p>
                                    </div>
                                    <button onClick={handleCloseSubmit} disabled={realBalance === '' || isSubmitting || isNaN(parseFloat(realBalance))} className="w-full text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg px-5 py-3 text-center flex items-center justify-center gap-2 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed">
                                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faDoorClosed} />}
                                        <span>{isSubmitting ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- Right Column: Movements --- */}
                        <div className="lg:col-span-2">
                             <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 h-full">
                                <h2 className="text-xl font-bold text-white mb-4">Últimos Movimientos en Efectivo</h2>
                                <div className="relative overflow-x-auto max-h-[34rem] overflow-y-auto">
                                    <table className="w-full text-sm text-left text-gray-400">
                                        <thead className="text-xs text-white uppercase bg-pr-dark sticky top-0 z-10 border-b border-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">Hora</th>
                                                <th scope="col" className="px-6 py-3">Tipo</th>
                                                <th scope="col" className="px-6 py-3 hidden sm:table-cell">Descripción</th>
                                                <th scope="col" className="px-6 py-3 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {loadingMovements && movements.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-8"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-pr-yellow text-2xl"/></td></tr>
                                            ) : movements.length > 0 ? (
                                                movements.map((mov) => (
                                                    <tr key={mov.id_historial_caja} className="hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-3 whitespace-nowrap">{new Date(mov.fecha_movimiento_hcaja).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td className="px-6 py-3"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ${getMovementBadgeClass(mov.tipo_event_caja)}`}>{mov.tipo_event_caja?.nombre_evento || 'N/A'}</span></td>
                                                        <td className="px-6 py-3 hidden sm:table-cell">{mov.descripcion_hcaja || '-'}</td>
                                                        <td className={`px-6 py-3 text-right font-medium ${parseFloat(mov.cantidad_movida_hcaja) < 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(mov.cantidad_movida_hcaja)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="4" className="text-center py-8 text-pr-gray">No hay movimientos registrados.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    
            {/* Modals */}
            <OpenCajaModal isOpen={showOpenCajaModal} onClose={() => setShowOpenCajaModal(false)} onSubmit={handleOpenSubmit} isSubmitting={isSubmitting} />
            <MovimientoCajaModal isOpen={showMovementModal.show} onClose={() => setShowMovementModal({ show: false, type: 'INGRESO' })} onSuccess={handleMovementSuccess} tipoMovimiento={showMovementModal.type} registerMovement={(monto, motivo) => registerMovement(monto, motivo, showMovementModal.type)} isSubmitting={isSubmitting} />
            <ConfirmDeleteModal isOpen={showConfirmCloseModal} onClose={() => setShowConfirmCloseModal(false)} onConfirm={confirmCloseCaja} itemName={`el cierre de caja por un valor de ${formatCurrency(realBalance)}`} itemType="cierre"/>
        </>
    );
};

export default JefeCaja;
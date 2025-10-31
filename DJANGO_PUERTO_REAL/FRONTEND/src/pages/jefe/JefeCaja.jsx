    import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import {
        faDoorOpen, faPlus, faMinus, faDoorClosed, faCashRegister,
        faSpinner, faExclamationTriangle, faTimes, faFloppyDisk
    } from '@fortawesome/free-solid-svg-icons';
    import apiClient from '@/api/apiClient';
    import { toast } from 'react-hot-toast';

    // --- Floating Input Component (Reusable) ---
    const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false, step = undefined, min = undefined }) => (
        <div className="relative z-0 w-full">
            <input
                type={type} name={name} id={`caja_${name}`} value={value} onChange={onChange}
                required={required} step={step} min={min} autoComplete="off"
                className={`block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border rounded-lg appearance-none focus:outline-none focus:ring-0 ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-pr-yellow'} peer`}
                placeholder=" "
            />
            <label
                htmlFor={`caja_${name}`}
                className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-2.5 ${error ? 'text-red-400' : 'text-gray-400'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${error ? 'peer-focus:text-red-400' : 'peer-focus:text-pr-yellow'}`}
            > {label}{required && ' *'} </label>
            {error && <p className="mt-1 text-xs text-red-400">{Array.isArray(error) ? error[0] : error}</p>}
        </div>
    );

    // --- Floating Textarea Component ---
    const FormTextarea = ({ name, label, value, onChange, error, required = false, rows = 3 }) => (
        <div className="relative z-0 w-full">
            <textarea
                name={name} id={`caja_${name}`} value={value} onChange={onChange} required={required} rows={rows}
                className={`block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border rounded-lg appearance-none focus:outline-none focus:ring-0 ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-pr-yellow'} peer resize-none`}
                placeholder=" "
            />
            <label
                htmlFor={`caja_${name}`}
                className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-2.5 ${error ? 'text-red-400' : 'text-gray-400'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${error ? 'peer-focus:text-red-400' : 'peer-focus:text-pr-yellow'}`}
            > {label}{required && ' *'} </label>
            {error && <p className="mt-1 text-xs text-red-400">{Array.isArray(error) ? error[0] : error}</p>}
        </div>
    );


    const JefeCaja = () => {
        // --- STATE ---
        const [cashStatus, setCashStatus] = useState({ isOpen: false, data: null, loading: true, error: null });
        const [movements, setMovements] = useState([]);
        const [loadingMovements, setLoadingMovements] = useState(false);
        const [showOpenCashModal, setShowOpenCashModal] = useState(false);
        const [showMovementModal, setShowMovementModal] = useState({ show: false, type: 'INGRESO' });
        const [realBalance, setRealBalance] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [isClosing, setIsClosing] = useState(false);

        // --- CURRENCY FORMATTER (Corregida) ---
        const formatCurrency = (value, sign = '') => {
            const valueAsNumber = Number(value) || 0;
            const formattedValue = Math.abs(valueAsNumber).toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            let prefix = sign;
            if (valueAsNumber < 0 && sign !== '-') {
                prefix = '-';
            } else if (valueAsNumber === 0) {
                prefix = '';
            }
            return `${prefix}${formattedValue}`;
        };

        // --- DERIVED DATA & CALCULATIONS ---
        const cashRegisterData = cashStatus.data || {};
        const summaryData = cashRegisterData.resumen || {};
        const initialBalance = cashRegisterData.monto_apertura_caja || 0;
        const cashSales = summaryData.ventas || 0;
        const otherIncome = summaryData.ingresos || 0;
        const cashOutflows = summaryData.egresos || 0; // Egreso viene NEGATIVO desde API
        
        const totalCashIn = cashSales + otherIncome;
        const theoreticalBalance = parseFloat(initialBalance) + parseFloat(totalCashIn) + parseFloat(cashOutflows);
        const difference = realBalance !== '' ? parseFloat(realBalance) - theoreticalBalance : null;


        // --- DATA FETCHING ---
        const fetchCashStatus = useCallback(async () => {
            setCashStatus(prev => ({ ...prev, loading: true, error: null }));
            try {
                const data = await apiClient('/api/caja/estado/');
                setCashStatus({
                    isOpen: data.caja_abierta || false,
                    data: data.caja_abierta ? data : null,
                    loading: false,
                    error: null
                });
                if (data.caja_abierta) {
                    fetchMovements();
                }
            } catch (error) {
                console.error("Fetch Cash Status Error:", error);
                toast.error("Error al obtener estado de la caja.");
                setCashStatus({ isOpen: false, data: null, loading: false, error: error.message });
            }
        }, []);

        const fetchMovements = useCallback(async () => {
            setLoadingMovements(true);
            try {
                const data = await apiClient('/api/caja/historial/');
                setMovements(data.movimientos || []);
                // Update summary data in cashStatus if available from this endpoint
                if (data.resumen && cashStatus.isOpen) {
                    setCashStatus(prev => ({
                        ...prev,
                        data: { ...prev.data, resumen: data.resumen }
                    }));
                }
            } catch (error) {
                console.error("Fetch Movements Error:", error);
                toast.error("Error al cargar movimientos.");
                setMovements([]);
            } finally {
                setLoadingMovements(false);
            }
        }, [cashStatus.isOpen]);

        // --- EFECTO DE MONTAJE Y POLLING ---
        useEffect(() => {
            fetchCashStatus();
            
            let intervalId = null;
            
            // POLLING: Refresca movimientos cada 30 segundos si la caja está abierta
            if (cashStatus.isOpen) {
                intervalId = setInterval(() => {
                    fetchMovements(); 
                }, 30000); 
            }

            return () => {
                if (intervalId) {
                    clearInterval(intervalId); // Limpia el polling
                }
            };
        }, [cashStatus.isOpen, fetchCashStatus, fetchMovements]);


        // --- HANDLERS ---
        const handleOpenCash = async (e) => {
            e.preventDefault();
            const amount = e.target.elements['caja_initial_balance'].value;
            setIsSubmitting(true);
            try {
                await apiClient('/api/caja/abrir/', {
                    method: 'POST',
                    body: JSON.stringify({ monto_inicial: parseFloat(amount) })
                });
                toast.success('Caja abierta con éxito.');
                setShowOpenCashModal(false);
                fetchCashStatus();
            } catch (error) {
                toast.error(error.data?.detail || error.data?.monto_inicial?.[0] || 'No se pudo abrir la caja.');
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleRegisterMovement = async (e) => {
            e.preventDefault();
            const amount = e.target.elements['caja_movement_amount'].value;
            const reason = e.target.elements['caja_movement_reason'].value;
            const type = showMovementModal.type;

            if (!amount || parseFloat(amount) <= 0) {
                return toast.error("El monto debe ser un valor positivo.");
            }
            if (!reason.trim()) {
                return toast.error("La descripción/motivo es obligatoria.");
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
                setShowMovementModal({ show: false, type: 'INGRESO' });
                fetchMovements();
            } catch (error) {
                toast.error(error.data?.detail || error.data?.monto?.[0] || error.data?.motivo?.[0] || `No se pudo registrar el ${type.toLowerCase()}.`);
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleCloseCash = async () => {
            if (realBalance === '' || isNaN(parseFloat(realBalance)) || parseFloat(realBalance) < 0) {
                return toast.error('Debes ingresar un Saldo Real Contado válido.');
            }
            setIsClosing(true);
            try {
                await apiClient('/api/caja/cerrar/', {
                    method: 'POST',
                    body: JSON.stringify({ monto_cierre_real: parseFloat(realBalance) })
                });
                toast.success('Caja cerrada con éxito.');
                fetchCashStatus();
                setRealBalance('');
            } catch (error) {
                toast.error(error.data?.detail || error.data?.monto_cierre_real?.[0] || 'No se pudo cerrar la caja.');
            } finally {
                setIsClosing(false);
            }
        };

        // --- Dynamic Styles ---
        const getMovementBadgeClass = (tipoEvento) => {
            const typeLower = tipoEvento?.nombre_evento?.toLowerCase() || '';
            if (typeLower.includes('apertura')) return 'bg-blue-600/20 text-blue-300';
            if (typeLower.includes('ingreso')) return 'bg-green-600/20 text-green-300';
            if (typeLower.includes('venta')) return 'bg-teal-600/20 text-teal-300';
            if (typeLower.includes('egreso') || typeLower.includes('retiro')) return 'bg-red-600/20 text-red-300';
            return 'bg-gray-700 text-gray-300';
        };
        const getDifferenceClass = () => {
            if (difference === null || difference === 0) return 'text-white';
            return difference < 0 ? 'text-red-400' : 'text-green-400';
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
                            onClick={() => setShowOpenCashModal(true)}
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

                        {/* --- Cash Summary Cards --- */}
                        <h2 className="text-2xl font-bold text-white mb-4">Resumen de Efectivo</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-pr-dark p-4 rounded-lg shadow border border-pr-gray/20"><p className="text-sm text-pr-gray mb-1">Saldo Inicial</p><p className="text-2xl font-bold text-white">{formatCurrency(initialBalance)}</p></div>
                            <div className="bg-pr-dark p-4 rounded-lg shadow border border-pr-gray/20"><p className="text-sm text-pr-gray mb-1">Ingresos Efectivo</p><p className="text-2xl font-bold text-green-400">{formatCurrency(totalCashIn, '+')}</p></div>
                            <div className="bg-pr-dark p-4 rounded-lg shadow border border-pr-gray/20"><p className="text-sm text-pr-gray mb-1">Egresos Efectivo</p><p className="text-2xl font-bold text-red-400">{formatCurrency(cashOutflows)}</p></div> {/* API sends negative */}
                            <div className="bg-pr-dark p-4 rounded-lg shadow border-2 border-pr-yellow"><p className="text-sm text-pr-gray mb-1">Saldo Teórico (Efectivo)</p><p className="text-2xl font-bold text-pr-yellow">{formatCurrency(theoreticalBalance)}</p></div>
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

                        {/* --- Recent Movements Table --- */}
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

                        {/* --- Cash Closing Section --- */}
                        <div className="mt-12 bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                            <h2 className="text-2xl font-bold text-white mb-6">Cierre y Arqueo de Caja</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                {/* Real Balance Input */}
                                <div className="relative z-0 w-full">
                                    <input
                                        type="number" step="0.01" min="0" id="caja_real_balance" value={realBalance}
                                        onChange={(e) => setRealBalance(e.target.value)}
                                        className={`block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border rounded-lg appearance-none focus:outline-none focus:ring-0 peer ${realBalance === '' ? 'border-gray-500 focus:border-pr-yellow' : 'border-pr-yellow'}`}
                                        placeholder=" " required
                                    />
                                    <label
                                        htmlFor="caja_real_balance"
                                        className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${realBalance === '' ? 'text-gray-400 peer-focus:text-pr-yellow' : 'text-pr-yellow'}`}
                                    >
                                        Saldo Real Contado (Efectivo) *
                                    </label>
                                </div>
                                {/* Difference Display */}
                                <div className="text-center md:pb-1">
                                    <p className="text-sm text-pr-gray">Diferencia</p>
                                    <p className={`text-2xl font-bold ${getDifferenceClass()}`}>
                                        {difference === null ? '-' : formatCurrency(difference)}
                                    </p>
                                </div>
                                {/* Close Cash Button */}
                                <button
                                    onClick={handleCloseCash}
                                    disabled={realBalance === '' || isClosing || isNaN(parseFloat(realBalance))}
                                    className="w-full text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center gap-2 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {isClosing ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    ) : (
                                        <FontAwesomeIcon icon={faDoorClosed} />
                                    )}
                                    <span>{isClosing ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======================= MODALS ======================= */}

                {/* --- OPEN CASH MODAL --- */}
                <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70 transition-opacity duration-300 ${showOpenCashModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowOpenCashModal(false)}>
                    <div className={`relative p-0 w-full max-w-md transition-all duration-300 ${showOpenCashModal ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`} onClick={e => e.stopPropagation()}>
                        <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                            <div className="flex items-center justify-between p-4 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Abrir Caja</h3>
                                <button type="button" onClick={() => setShowOpenCashModal(false)} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><FontAwesomeIcon icon={faTimes}/></button>
                            </div>
                            <form className="p-4 space-y-6" onSubmit={handleOpenCash}>
                                {/* Use FormInput for consistency */}
                                <FormInput
                                    name="initial_balance" label="Saldo Inicial en Efectivo" type="number" step="0.01" min="0" required
                                    // Note: Using the name 'initial_balance' to match the handleSubmit function's expected element name
                                />
                                <div className="flex justify-end space-x-3 border-t border-gray-600 pt-4"> {/* Footer style */}
                                    <button type="button" onClick={() => setShowOpenCashModal(false)} disabled={isSubmitting} className="text-gray-400 hover:text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[150px] flex justify-center items-center">
                                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : 'Confirmar Apertura'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- MOVEMENT MODAL (INGRESO/EGRESO) --- */}
                <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70 transition-opacity duration-300 ${showMovementModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowMovementModal({ show: false, type: 'INGRESO' })}>
                    <div className={`relative p-0 w-full max-w-md transition-all duration-300 ${showMovementModal.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`} onClick={e => e.stopPropagation()}>
                        <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                            <div className="flex items-center justify-between p-4 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Registrar {showMovementModal.type === 'INGRESO' ? 'Ingreso' : 'Egreso'}</h3>
                                <button type="button" onClick={() => setShowMovementModal({ show: false, type: 'INGRESO' })} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><FontAwesomeIcon icon={faTimes}/></button>
                            </div>
                            <form className="p-4 space-y-6" onSubmit={handleRegisterMovement}>
                                <FormInput
                                    name="movement_amount" label="Monto" type="number" step="0.01" min="0.01" required
                                />
                                <FormTextarea
                                    name="movement_reason" label="Descripción / Motivo" required
                                />
                                <div className="flex justify-end space-x-3 border-t border-gray-600 pt-4">
                                    <button type="button" onClick={() => setShowMovementModal({ show: false, type: 'INGRESO' })} disabled={isSubmitting} className="text-gray-400 hover:text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className={`font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[180px] flex justify-center items-center ${showMovementModal.type === 'INGRESO' ? 'text-pr-dark bg-pr-yellow hover:bg-yellow-400' : 'text-white bg-red-600 hover:bg-red-700'}`}>
                                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : null}
                                        {isSubmitting ? 'Registrando...' : `Confirmar ${showMovementModal.type === 'INGRESO' ? 'Ingreso' : 'Egreso'}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    export default JefeCaja;
import React, { useState, useEffect } from 'react';
// Nota: Asegúrate de tener estas librerías instaladas en tu proyecto de React.
// Ejecuta: npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen, faPlus, faMinus, faDoorClosed, faCashRegister } from '@fortawesome/free-solid-svg-icons';

const JefeCaja = () => {
    const [isCashOpen, setIsCashOpen] = useState(false);
    const [showOpenCashModal, setShowOpenCashModal] = useState(false);
    const [showIngresoModal, setShowIngresoModal] = useState(false);
    const [showRetiroModal, setShowRetiroModal] = useState(false);

    // State for financial data
    const [initialBalance, setInitialBalance] = useState(0);
    const [realBalance, setRealBalance] = useState('');
    const [movements, setMovements] = useState([]);
    const [cashData, setCashData] = useState({
        cashSales: 0,
        cardSales: 0,
        qrSales: 0,
        transferSales: 0,
        otherIncome: 0,
        cashOutflows: 0
    });

    // Derived state for calculations
    const totalCashIn = cashData.cashSales + cashData.otherIncome;
    const theoreticalBalance = initialBalance + totalCashIn - cashData.cashOutflows;
    const difference = realBalance ? parseFloat(realBalance) - theoreticalBalance : 0;

    // Helper to format currency
    const formatCurrency = (value, sign = '') => {
        const valueAsNumber = Number(value) || 0;
        const formattedValue = Math.abs(valueAsNumber).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
        });
        return `${sign}${formattedValue}`;
    };
    
    // --- Handlers ---

    const handleOpenCash = (e) => {
        e.preventDefault();
        const balance = parseFloat(e.target.elements['initial-balance-input'].value) || 0;
        
        // TODO: Send data to API for opening the cash register
        setInitialBalance(balance);
        setIsCashOpen(true);
        setShowOpenCashModal(false);
        setRealBalance('');

        const now = new Date();
        setMovements([{
            time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            type: 'APERTURA',
            description: 'Saldo inicial de caja',
            amount: balance
        }]);
    };

    const handleRegisterIngreso = (e) => {
        e.preventDefault();
        const amount = parseFloat(e.target.elements['ingreso-monto'].value) || 0;
        const description = e.target.elements['ingreso-descripcion'].value || 'Ingreso sin descripción';
        
        if (amount <= 0) return;

        // TODO: Send data to API for the new income
        setCashData(prev => ({ ...prev, otherIncome: prev.otherIncome + amount }));
        
        const now = new Date();
        const newMovement = {
            time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            type: 'INGRESO',
            description,
            amount,
        };
        setMovements(prev => [newMovement, ...prev]);
        setShowIngresoModal(false);
        e.target.reset();
    };

    const handleRegisterRetiro = (e) => {
        e.preventDefault();
        const amount = parseFloat(e.target.elements['retiro-monto'].value) || 0;
        const description = e.target.elements['retiro-descripcion'].value || 'Retiro sin descripción';

        if (amount <= 0) return;
        
        // TODO: Send data to API for the new withdrawal
        setCashData(prev => ({ ...prev, cashOutflows: prev.cashOutflows + amount }));
        
        const now = new Date();
        const newMovement = {
            time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            type: 'RETIRO',
            description,
            amount: -amount, // Store as negative
        };
        setMovements(prev => [newMovement, ...prev]);
        setShowRetiroModal(false);
        e.target.reset();
    };

    const handleCloseCash = () => {
        if (realBalance === '') {
            console.error('El saldo real es requerido para cerrar la caja.');
            // Optionally, show a user-friendly error message here
            return;
        }
        
        // TODO: Here you could POST the final data to an API endpoint before fetching the PDF.
        
        // This URL should point to your Django view that generates and returns the PDF
        const pdfUrl = 'http://127.0.0.1:8000/api/reporte/caja-pdf/';
        window.open(pdfUrl, '_blank');
        
        // Reset state after closing
        setIsCashOpen(false);
        setInitialBalance(0);
        setMovements([]);
        setCashData({ cashSales: 0, cardSales: 0, qrSales: 0, transferSales: 0, otherIncome: 0, cashOutflows: 0 });
        setRealBalance('');
    };

    // --- Dynamic Styles ---
    const getMovementBadgeClass = (type) => {
        switch (type) {
            case 'APERTURA': return 'bg-blue-900 text-blue-300';
            case 'INGRESO': return 'bg-green-900 text-green-300';
            case 'VENTA': return 'bg-teal-900 text-teal-300';
            case 'RETIRO': return 'bg-red-900 text-red-300';
            default: return 'bg-gray-700 text-gray-300';
        }
    };
    
    const getDifferenceClass = () => {
        if (!realBalance || difference === 0) return 'text-white';
        return difference < 0 ? 'text-red-500' : 'text-green-500';
    };

    return (
        <>
            {/* VIEW WHEN CASH IS CLOSED */}
            {!isCashOpen ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                    <FontAwesomeIcon icon={faCashRegister} className="text-gray-500 text-6xl mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-4">La caja está cerrada</h1>
                    <p className="text-gray-400 mb-8 max-w-md">Para comenzar a registrar ventas y otros movimientos, primero debes realizar la apertura de caja con el saldo inicial.</p>
                    <button onClick={() => setShowOpenCashModal(true)} className="text-gray-900 bg-yellow-400 hover:bg-yellow-500 font-bold rounded-lg text-lg px-8 py-4 text-center flex items-center justify-center gap-3 mx-auto transition-colors">
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Abrir Caja</span>
                    </button>
                </div>
            ) : (
             /* VIEW WHEN CASH IS OPEN */
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Control de Caja</h1>
                            <p className="text-gray-400">Fecha: <span className="font-semibold text-white">{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Resumen de Efectivo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Saldo Inicial</p><p className="text-2xl font-bold text-white">{formatCurrency(initialBalance)}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Ingresos en Efectivo</p><p className="text-2xl font-bold text-green-500">{formatCurrency(totalCashIn, '+')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Egresos en Efectivo</p><p className="text-2xl font-bold text-red-500">{formatCurrency(cashData.cashOutflows, '-')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-yellow-400"><p className="text-sm text-gray-400">Saldo Teórico (Efectivo)</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(theoreticalBalance)}</p></div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Desglose General de Ventas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Ventas Efectivo</p><p className="text-2xl font-bold text-green-500">{formatCurrency(cashData.cashSales, '+')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Otros Ingresos (Efectivo)</p><p className="text-2xl font-bold text-green-400">{formatCurrency(cashData.otherIncome, '+')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Ventas con Tarjeta</p><p className="text-2xl font-bold text-blue-500">{formatCurrency(cashData.cardSales, '+')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Ventas con QR</p><p className="text-2xl font-bold text-cyan-400">{formatCurrency(cashData.qrSales, '+')}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg"><p className="text-sm text-gray-400">Ventas Transferencia</p><p className="text-2xl font-bold text-purple-400">{formatCurrency(cashData.transferSales, '+')}</p></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button onClick={() => setShowIngresoModal(true)} className="w-full sm:w-auto text-gray-900 bg-yellow-400 hover:bg-yellow-500 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Registrar Ingreso</span>
                        </button>
                        <button onClick={() => setShowRetiroModal(true)} className="w-full sm:w-auto text-white bg-gray-600 hover:bg-gray-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors">
                            <FontAwesomeIcon icon={faMinus} />
                            <span>Registrar Retiro</span>
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Últimos Movimientos en Efectivo</h2>
                    <div className="relative overflow-x-auto shadow-md rounded-lg max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-white uppercase bg-gray-800 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Hora</th>
                                    <th scope="col" className="px-6 py-3">Tipo</th>
                                    <th scope="col" className="px-6 py-3 hidden sm:table-cell">Descripción</th>
                                    <th scope="col" className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.length > 0 ? [...movements].reverse().map((mov, index) => (
                                    <tr key={index} className="border-b bg-gray-800 border-gray-700 hover:bg-gray-700">
                                        <td className="px-6 py-4">{mov.time}</td>
                                        <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${getMovementBadgeClass(mov.type)}`}>{mov.type}</span></td>
                                        <td className="px-6 py-4 hidden sm:table-cell">{mov.description}</td>
                                        <td className={`px-6 py-4 text-right font-medium ${mov.amount < 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(mov.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No hay movimientos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">Cierre y Arqueo de Caja</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label htmlFor="real-balance-input" className="block mb-2 text-sm font-medium text-gray-300">Saldo Real Contado (Efectivo)</label>
                                <input type="number" id="real-balance-input" value={realBalance} onChange={(e) => setRealBalance(e.target.value)} className="p-3 text-sm text-white border border-gray-600 rounded-lg bg-gray-900 focus:ring-yellow-400 focus:border-yellow-400 w-full" placeholder="Ingrese monto contado..." />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Diferencia</p>
                                <p className={`text-2xl font-bold ${getDifferenceClass()}`}>{formatCurrency(difference)}</p>
                            </div>
                            <button onClick={handleCloseCash} className="w-full text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center gap-2 transition-colors">
                                <FontAwesomeIcon icon={faDoorClosed} />
                                <span>Confirmar y Cerrar Caja</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: OPEN CASH */}
            {showOpenCashModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-gray-800">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Abrir Caja</h3>
                                <button type="button" onClick={() => setShowOpenCashModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleOpenCash}>
                                    <div>
                                        <label htmlFor="initial-balance-input" className="block mb-2 text-sm font-medium text-white">Saldo Inicial en Efectivo</label>
                                        <input type="number" name="initial-balance-input" id="initial-balance-input" step="0.01" min="0" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="$0.00" required />
                                    </div>
                                    <button type="submit" className="w-full text-gray-900 bg-yellow-400 hover:bg-yellow-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">Confirmar Apertura</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: REGISTER INCOME */}
            {showIngresoModal && (
                 <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-gray-800">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600"><h3 className="text-xl font-semibold text-white">Registrar Ingreso de Dinero</h3><button type="button" onClick={() => setShowIngresoModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg><span className="sr-only">Cerrar</span></button></div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleRegisterIngreso}>
                                    <div><label htmlFor="ingreso-monto" className="block mb-2 text-sm font-medium text-white">Monto</label><input type="number" name="ingreso-monto" id="ingreso-monto" step="0.01" min="0" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="$0.00" required /></div>
                                    <div><label htmlFor="ingreso-descripcion" className="block mb-2 text-sm font-medium text-white">Descripción</label><textarea name="ingreso-descripcion" id="ingreso-descripcion" rows="4" className="block p-2.5 w-full text-sm rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="Escriba el motivo del ingreso..." required></textarea></div>
                                    <button type="submit" className="w-full text-gray-900 bg-yellow-400 hover:bg-yellow-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">Confirmar Ingreso</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: REGISTER WITHDRAWAL */}
            {showRetiroModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-gray-800">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600"><h3 className="text-xl font-semibold text-white">Registrar Retiro de Dinero</h3><button type="button" onClick={() => setShowRetiroModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg><span className="sr-only">Cerrar</span></button></div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleRegisterRetiro}>
                                    <div><label htmlFor="retiro-monto" className="block mb-2 text-sm font-medium text-white">Monto</label><input type="number" name="retiro-monto" id="retiro-monto" step="0.01" min="0" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="$0.00" required /></div>
                                    <div><label htmlFor="retiro-descripcion" className="block mb-2 text-sm font-medium text-white">Descripción</label><textarea name="retiro-descripcion" id="retiro-descripcion" rows="4" className="block p-2.5 w-full text-sm rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="Escriba el motivo del retiro..." required></textarea></div>
                                    <button type="submit" className="w-full text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">Confirmar Retiro</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeCaja;


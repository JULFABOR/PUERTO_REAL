import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faDoorOpen, faFileExport, faPlus, faMinus, faDoorClosed } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';

const JefeCaja = () => {
    const [isCashOpen, setIsCashOpen] = useState(false);
    const [showOpenCashModal, setShowOpenCashModal] = useState(false);
    const [showIngresoModal, setShowIngresoModal] = useState(false);
    const [showRetiroModal, setShowRetiroModal] = useState(false);

    // TODO: Fetch data from API
    const [initialBalance, setInitialBalance] = useState(0);
    const [movements, setMovements] = useState([]);
    const [cashData, setCashData] = useState({
        cashSales: 0, cardSales: 0, qrSales: 0, transferSales: 0, otherIncome: 0, cashOutflows: 0
    });

    const totalCashIn = cashData.cashSales + cashData.otherIncome;
    const theoreticalBalance = initialBalance + totalCashIn - cashData.cashOutflows;

    const formatCurrency = (value, sign = '') => `${sign}${value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`;

    const handleOpenCash = (e) => {
        e.preventDefault();
        const balance = parseFloat(e.target.elements['initial-balance-input'].value) || 0;
        // TODO: Send data to API
        setInitialBalance(balance);
        setIsCashOpen(true);
        setShowOpenCashModal(false);
        const now = new Date();
        setMovements([{
            time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            type: 'APERTURA',
            description: 'Saldo inicial de caja',
            amount: balance
        }]);
    };

    const handleCloseCash = () => {
        // TODO: Send data to API
        generatePDFReport();
        setIsCashOpen(false);
        setInitialBalance(0);
        setMovements([]);
    };
    
    const generatePDFReport = () => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('es-AR');
        let y = 20; // Posición vertical inicial

        doc.setFontSize(22);
        doc.text("Reporte de Caja - PUERTO REAL", 105, y, { align: 'center' });
        y += 10;
        doc.setFontSize(14);
        doc.text(`Fecha: ${today}`, 105, y, { align: 'center' });
        y += 15;

        doc.setFontSize(16);
        doc.text("Resumen de Efectivo", 14, y);
        y += 8;
        doc.setFontSize(12);
        doc.text(`- Saldo Inicial: ${formatCurrency(initialBalance)}`, 14, y);
        y += 7;
        doc.text(`- Total Ingresos: ${formatCurrency(totalCashIn, '+')}`, 14, y);
        y += 7;
        doc.text(`- Total Egresos: ${formatCurrency(cashData.cashOutflows, '-')}`, 14, y);
        y += 7;
        doc.text(`- Saldo Teórico: ${formatCurrency(theoreticalBalance)}`, 14, y);

        doc.save(`reporte-caja-${new Date().toISOString().slice(0,10)}.pdf`);
    };


    return (
        <>
            {!isCashOpen ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                    <FontAwesomeIcon icon={faCashRegister} className="text-pr-gray text-6xl mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-4">La caja está cerrada</h1>
                    <p className="text-pr-gray mb-8 max-w-md">Para comenzar a registrar ventas y otros movimientos, primero debes realizar la apertura de caja con el saldo inicial.</p>
                    <button onClick={() => setShowOpenCashModal(true)} className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-lg px-8 py-4 text-center flex items-center justify-center gap-3 mx-auto">
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Abrir Caja</span>
                    </button>
                </div>
            ) : (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Control de Caja</h1>
                            <p className="text-pr-gray">Fecha: <span className="font-semibold text-white">{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Resumen de Efectivo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Saldo Inicial</p><p className="text-2xl font-bold text-white">{formatCurrency(initialBalance)}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ingresos en Efectivo</p><p className="text-2xl font-bold text-green-500">{formatCurrency(totalCashIn, '+')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Egresos en Efectivo</p><p className="text-2xl font-bold text-red-500">{formatCurrency(cashData.cashOutflows, '-')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg border-2 border-pr-yellow"><p className="text-sm text-pr-gray">Saldo Teórico (Efectivo)</p><p className="text-2xl font-bold text-pr-yellow">{formatCurrency(theoreticalBalance)}</p></div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Desglose de Movimientos del Día</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ventas Efectivo</p><p className="text-2xl font-bold text-green-500">{formatCurrency(cashData.cashSales, '+')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Otros Ingresos (Efectivo)</p><p className="text-2xl font-bold text-green-400">{formatCurrency(cashData.otherIncome, '+')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ventas con Tarjeta</p><p className="text-2xl font-bold text-blue-500">{formatCurrency(cashData.cardSales, '+')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ventas con QR</p><p className="text-2xl font-bold text-cyan-400">{formatCurrency(cashData.qrSales, '+')}</p></div>
                        <div className="bg-pr-dark p-4 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ventas Transferencia</p><p className="text-2xl font-bold text-purple-400">{formatCurrency(cashData.transferSales, '+')}</p></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button onClick={() => setShowIngresoModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Registrar Ingreso</span>
                        </button>
                        <button onClick={() => setShowRetiroModal(true)} className="w-full sm:w-auto text-white bg-pr-gray hover:bg-gray-600 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faMinus} />
                            <span>Registrar Retiro</span>
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Últimos Movimientos en Efectivo</h2>
                    <div className="relative overflow-x-auto shadow-md rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-white uppercase bg-pr-dark">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Hora</th><th scope="col" className="px-6 py-3">Tipo</th><th scope="col" className="px-6 py-3 hidden sm:table-cell">Descripción</th><th scope="col" className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((mov, index) => (
                                    <tr key={index} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                        <td className="px-6 py-4">{mov.time}</td>
                                        <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${mov.type === 'APERTURA' ? 'bg-blue-900 text-blue-300' : ''}`}>{mov.type}</span></td>
                                        <td className="px-6 py-4 hidden sm:table-cell">{mov.description}</td>
                                        <td className="px-6 py-4 text-right font-medium text-white">{formatCurrency(mov.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">Cierre y Arqueo de Caja</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label htmlFor="real-balance-input" className="block mb-2 text-sm font-medium text-gray-300">Saldo Real Contado (Efectivo)</label>
                                <input type="number" id="real-balance-input" className="p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow w-full" placeholder="Ingrese monto contado..." />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-pr-gray">Diferencia</p>
                                <p className="text-2xl font-bold text-white">$0.00</p>
                            </div>
                            <button onClick={handleCloseCash} className="w-full text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faDoorClosed} />
                                <span>Confirmar y Cerrar Caja</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOpenCashModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
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
                                        <input type="number" name="initial-balance-input" id="initial-balance-input" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="$0.00" required />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Confirmar Apertura</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showIngresoModal && (
                 <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600"><h3 className="text-xl font-semibold text-white">Registrar Ingreso de Dinero</h3><button type="button" onClick={() => setShowIngresoModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg><span className="sr-only">Cerrar</span></button></div>
                            <div className="p-4 md:p-5"><form className="space-y-4" action="#"><div><label htmlFor="ingreso-monto" className="block mb-2 text-sm font-medium text-white">Monto</label><input type="number" name="ingreso-monto" id="ingreso-monto" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="$0.00" required /></div><div><label htmlFor="ingreso-descripcion" className="block mb-2 text-sm font-medium text-white">Descripción</label><textarea id="ingreso-descripcion" rows="4" className="block p-2.5 w-full text-sm rounded-lg border bg-pr-dark-gray border-gray-600 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Escriba el motivo del ingreso..."></textarea></div><button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Confirmar Ingreso</button></form></div>
                        </div>
                    </div>
                </div>
            )}

            {showRetiroModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600"><h3 className="text-xl font-semibold text-white">Registrar Retiro de Dinero</h3><button type="button" onClick={() => setShowRetiroModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"><svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg><span className="sr-only">Cerrar</span></button></div>
                            <div className="p-4 md:p-5"><form className="space-y-4" action="#"><div><label htmlFor="retiro-monto" className="block mb-2 text-sm font-medium text-white">Monto</label><input type="number" name="retiro-monto" id="retiro-monto" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="$0.00" required /></div><div><label htmlFor="retiro-descripcion" className="block mb-2 text-sm font-medium text-white">Descripción</label><textarea id="retiro-descripcion" rows="4" className="block p-2.5 w-full text-sm rounded-lg border bg-pr-dark-gray border-gray-600 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Escriba el motivo del retiro..."></textarea></div><button type="submit" className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Confirmar Retiro</button></form></div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeCaja;

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faInbox, faHistory } from '@fortawesome/free-solid-svg-icons';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';

// Componente para formatear la fecha
const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

// Componente para el badge de movimiento
// MODIFICADO: Ahora 'tipo' es un string simple, no un objeto
const MovimientoBadge = ({ tipo, cantidad }) => {
    const isEntrada = cantidad > 0;
    const tipoLower = tipo?.toLowerCase() || '';
    const isVenta = tipoLower.includes('venta');
    const isAjuste = tipoLower.includes('ajuste');

    let bgColor = isEntrada ? 'bg-green-600/20' : 'bg-red-600/20';
    let textColor = isEntrada ? 'text-green-300' : 'text-red-300';

    if (isAjuste && !isVenta) {
        bgColor = 'bg-blue-600/20';
        textColor = 'text-blue-300';
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} whitespace-nowrap`}>
            {tipo || (isEntrada ? 'Entrada' : 'Salida')}
        </span>
    );
};

const StockHistoryModal = ({ isOpen, onClose, product }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            const fetchHistory = async () => {
                setLoading(true);
                setError(null);
                setHistory([]);
                try {
                    // Esta URL debe coincidir con la que creaste en Django
                    const data = await apiClient(`/api/stock/historial-producto/${product.id_producto}/`);
                    setHistory(data.results || data || []);
                } catch (err) {
                    setError(err.message || 'Error al cargar el historial.');
                    toast.error('No se pudo cargar el historial del producto.');
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, product]); // Se ejecuta cada vez que el modal se abre con un nuevo producto

    // Contenido del modal (Spinner, Error, Tabla vacía)
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-48 text-pr-yellow">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex justify-center items-center h-48 text-red-400">
                    <p>{error}</p>
                </div>
            );
        }

        if (history.length === 0) {
            return (
                <div className="flex flex-col justify-center items-center h-48 text-pr-gray">
                    <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                    <p className="font-bold text-white">Sin Movimientos</p>
                    <p className="text-sm">Este producto no tiene historial de stock.</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto border border-gray-700 rounded-lg max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3">Fecha y Hora</th>
                            <th scope="col" className="px-4 py-3">Tipo Movimiento</th>
                            <th scope="col" className="px-4 py-3">Empleado</th>
                            <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                            <th scope="col" className="px-4 py-3 text-center">Stock Anterior</th>
                            <th scope="col" className="px-4 py-3 text-center">Stock Nuevo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {history.map(item => (
                            <tr key={item.id_historial_stock} className="bg-pr-dark-gray hover:bg-gray-800">
                                
                                {/* --- CORRECCIÓN AQUÍ --- */}
                                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.fecha_movimiento_hstock)}</td>
                                
                                <td className="px-4 py-3">
                                    <MovimientoBadge 
                                        tipo={item.tipo_movimiento_hs} 
                                        cantidad={item.cantidad_hstock} 
                                    />
                                </td>
                                <td className="px-4 py-3 text-white">{item.empleado_hs || 'Sistema'}</td>
                                <td className={`px-4 py-3 text-center font-bold ${item.cantidad_hstock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.cantidad_hstock > 0 ? `+${item.cantidad_hstock}` : item.cantidad_hstock}
                                </td>
                                <td className="px-4 py-3 text-center font-mono">{item.stock_anterior_hstock}</td>
                                <td className="px-4 py-3 text-center font-mono text-white font-bold">{item.stock_nuevo_hstock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div
            className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`relative p-0 w-full max-w-4xl transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    {/* --- Encabezado --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <div>
                            <h3 className="text-xl font-semibold text-white">
                                Historial de Movimientos
                            </h3>
                            <p className="text-pr-yellow font-bold">{product?.nombre_producto || 'Cargando...'}</p>
                        </div>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                        </button>
                    </div>

                    {/* --- Cuerpo --- */}
                    <div className="p-4 md:p-6">
                        {renderContent()}
                    </div>

                    {/* --- Pie de Página (Footer) --- */}
                    <div className="flex items-center justify-end p-4 md:p-5 border-t border-gray-600 rounded-b">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-auto text-pr-dark bg-pr-gray hover:bg-pr-gray/80 font-bold rounded-lg text-sm px-5 py-2.5 text-center"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockHistoryModal;
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFileInvoice, faCalendarAlt, faBuilding, faDollarSign, faInfoCircle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

// --- Componente de Badge (Puedes reutilizar el que ya tienes) ---
// (Si no puedes reutilizarlo, copia el 'StatusBadge' de JefeSuppliers aquí)
const StatusBadge = ({ estado }) => {
    const nombreEstado = estado?.nombre_estado?.toLowerCase() || '';
    let bgColor = 'bg-gray-700';
    let textColor = 'text-gray-300';
    if (nombreEstado === 'recibida') {
        bgColor = 'bg-green-600/20'; textColor = 'text-green-300';
    } else if (nombreEstado === 'pendiente') {
        bgColor = 'bg-yellow-600/20'; textColor = 'text-yellow-300';
    } else if (nombreEstado === 'cancelada') {
        bgColor = 'bg-red-600/20'; textColor = 'text-red-300';
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} whitespace-nowrap`}>
            {estado?.nombre_estado || 'Desconocido'}
        </span>
    );
};

// --- Componente para fila de detalle ---
const DetailItem = ({ icon, label, children }) => (
    <div>
        <dt className="flex items-center text-sm font-medium text-pr-gray/80 uppercase tracking-wider">
            <FontAwesomeIcon icon={icon} className="w-4 h-4 mr-3" />
            {label}
        </dt>
        <dd className="mt-1 text-lg font-semibold text-white ml-7">
            {children}
        </dd>
    </div>
);

// --- Componente Principal del Modal ---
const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    // Formateadores rápidos
    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // Asegura que el modal no intente renderizar sin datos
    if (!isOpen || !order) return null;

    return (
        <div
            className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`relative p-0 w-full max-w-2xl transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    
                    {/* --- Encabezado --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">
                            Detalles de la Orden #{order.id_compra}
                        </h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                        </button>
                    </div>

                    {/* --- Cuerpo con Detalles --- */}
                    <div className="p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        
                        {/* --- Resumen de la Orden --- */}
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <DetailItem icon={faFileInvoice} label="ID Orden">
                                <span className="font-mono text-base">{order.id_compra}</span>
                            </DetailItem>
                            
                            <DetailItem icon={faBuilding} label="Proveedor">
                                {order.proveedor_compra?.nombre_proveedor || 'N/A'}
                            </DetailItem>

                            <DetailItem icon={faCalendarAlt} label="Fecha de Emisión">
                                {formatDate(order.fecha_compra)}
                            </DetailItem>

                            <DetailItem icon={faInfoCircle} label="Estado">
                                <StatusBadge estado={order.estado_compra} />
                            </DetailItem>
                            
                            <div className="md:col-span-2">
                                <DetailItem icon={faDollarSign} label="Monto Total">
                                    <span className="text-2xl text-pr-yellow">{formatCurrency(order.total_compra)}</span>
                                </DetailItem>
                            </div>
                        </dl>

                        <div>
                            <h4 className="flex items-center text-lg font-semibold text-white mb-3">
                                <FontAwesomeIcon icon={faBoxOpen} className="w-5 h-5 mr-3 text-pr-gray/80" />
                                Productos en esta Orden
                            </h4>
                            <div className="bg-pr-dark-gray rounded-lg border border-pr-gray/20 overflow-hidden">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-white uppercase bg-pr-gray/10">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Producto</th>
                                            <th scope="col" className="px-6 py-3 text-center">Cantidad</th>
                                            <th scope="col" className="px-6 py-3 text-right">Precio Unit.</th>
                                            <th scope="col" className="px-6 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">

                                        {order.detalles && order.detalles.length > 0 ? (
                                            order.detalles.map((item) => (
                                                
                                                /* CORRECCIÓN: La key ahora usa 'id_det_comp' */
                                                <tr key={item.id_det_comp} className="hover:bg-gray-800">
                                                    
                                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                                        {item.producto_dt_comp?.nombre_producto || 'Producto no encontrado'}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4 text-center">
                                                        {item.cant_det_comp}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4 text-right">
                                                        {formatCurrency(item.precio_unidad_det_comp)}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4 text-right font-medium text-white">
                                                        {formatCurrency(item.subtotal_det_comp)}
                                                    </td>
                                                    
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center p-6 text-pr-gray">
                                                    No se encontraron detalles de productos para esta orden.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

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

export default OrderDetailsModal;
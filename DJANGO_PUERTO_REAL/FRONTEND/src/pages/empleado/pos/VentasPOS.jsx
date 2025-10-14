import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faTrash, faPlus, faMinus, faMoneyBillWave, faCreditCard, faUniversity } from '@fortawesome/free-solid-svg-icons';

// --- Componente para el Pop-up del QR ---
const QrModal = ({ ventaData, onNuevaVenta }) => {
    if (!ventaData) return null;
    const puntosGanados = Math.floor(ventaData.total_venta / 1000);

    return (
        <div className="fixed inset-0 bg-pr-dark bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white text-pr-dark p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold mb-2">¡Venta Registrada con Éxito!</h2>
                <p className="text-pr-gray mb-6">El cliente puede escanear este QR para sumar sus puntos.</p>
                <div className="flex justify-center mb-6 p-4 bg-gray-100 rounded-lg">
                    <QRCodeSVG value={ventaData.qr_token} size={256} />
                </div>
                <div className="text-left mb-6 bg-pr-dark-gray text-white p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Total de la Venta:</span>
                        <span className="font-bold text-pr-yellow text-xl">${parseFloat(ventaData.total_venta).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Puntos a Sumar:</span>
                        <span className="font-bold text-pr-yellow text-xl">{puntosGanados}</span>
                    </div>
                </div>
                <button onClick={onNuevaVenta} className="w-full bg-pr-yellow text-pr-dark font-bold py-3 px-6 rounded-lg hover:bg-opacity-90">
                    Nueva Venta
                </button>
            </div>
        </div>
    );
};

QrModal.propTypes = {
    ventaData: PropTypes.shape({
        total_venta: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        qr_token: PropTypes.string.isRequired,
    }),
    onNuevaVenta: PropTypes.func.isRequired,
};

// --- Componente para el Modal de Pago ---
const PaymentModal = ({ isOpen, onClose, onConfirm, total }) => {
    const [montoRecibido, setMontoRecibido] = useState('');
    const vuelto = useMemo(() => {
        const recibido = parseFloat(montoRecibido);
        if (!isNaN(recibido) && recibido >= total) {
            return recibido - total;
        }
        return 0;
    }, [montoRecibido, total]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-pr-dark bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white text-pr-dark p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Finalizar Venta</h2>
                    <div className="text-right">
                        <span className="text-gray-500">Total a Pagar</span>
                        <p className="text-4xl font-bold text-pr-dark">${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-100 p-6 rounded-lg flex flex-col">
                        <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500"/> Efectivo</h3>
                        <div className="flex-grow space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cliente paga con:</label>
                                <input type="number" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} placeholder={total.toFixed(2)} className="w-full p-2 border border-gray-300 rounded-md text-lg" />
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Vuelto:</span>
                                <span className="font-bold text-green-600 text-2xl">${vuelto.toFixed(2)}</span>
                            </div>
                        </div>
                        <button onClick={() => onConfirm('efectivo')} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 mt-4">Confirmar Efectivo</button>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-lg flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faUniversity} className="text-purple-500"/> Transferencia</h3>
                            <p className="text-gray-600">Confirma la recepción de la transferencia.</p>
                        </div>
                        <button onClick={() => onConfirm('transferencia')} className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 mt-4">Confirmar Transferencia</button>
                    </div>
                    
                    <div className="bg-gray-100 p-6 rounded-lg flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faCreditCard} className="text-blue-500"/> Tarjeta / QR (Posnet)</h3>
                            <p className="text-gray-600">Confirma que el pago fue aprobado en el terminal.</p>
                        </div>
                        <button onClick={() => onConfirm('tarjeta_mp')} className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 mt-4">Confirmar Pago con Posnet</button>
                    </div>
                </div>
                <button onClick={onClose} className="w-full text-center text-gray-500 hover:underline mt-4">Cancelar Venta</button>
            </div>
        </div>
    );
};

PaymentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    total: PropTypes.number.isRequired,
};

// --- Componente Principal del TPV ---
const VentasPOS = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ventaFinalizadaData, setVentaFinalizadaData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const searchInputRef = useRef(null);

    const [clienteSearchTerm, setClienteSearchTerm] = useState('');
    const [clienteResults, setClienteResults] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    // Estados para configuración
    const [cajaId, setCajaId] = useState(null);
    const [clienteGenericoId, setClienteGenericoId] = useState(null);
    const [estadoVentaId, setEstadoVentaId] = useState(null);

    // Cargar configuración inicial
    useEffect(() => {
        const cargarConfiguracion = async () => {
            try {
                // Obtener caja abierta del empleado
                const responseCajas = await apiClient('/api/ventas/cajas/?estado_caja__nombre_estado=ABIERTA');
                const cajas = responseCajas.results || responseCajas;
                if (cajas && cajas.length > 0) {
                    setCajaId(cajas[0].id_caja);
                } else {
                    toast.error('No hay caja abierta. Por favor, abre una caja primero.');
                }

                // Obtener cliente genérico
                const responseClientes = await apiClient('/api/fidelizacion/clientes/?dni_cliente=00000000');
                const clientes = responseClientes.results || responseClientes;
                if (clientes && clientes.length > 0) {
                    setClienteGenericoId(clientes[0].id_cliente);
                } else {
                    toast.error('No se encontró cliente genérico. Ejecuta el script de configuración.');
                }

                // Obtener estado "completada"
                const responseEstados = await apiClient('/api/estados/?nombre_estado=COMPLETADA');
                const estados = responseEstados.results || responseEstados;
                if (estados && estados.length > 0) {
                    setEstadoVentaId(estados[0].id_estado);
                } else {
                    toast.error('No se encontró estado COMPLETADA. Ejecuta el script de configuración.');
                }
            } catch (error) {
                console.error('Error cargando configuración:', error);
                toast.error('Error al cargar configuración inicial');
            }
        };
        cargarConfiguracion();
    }, []);

    useEffect(() => {
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            apiClient(`/api/stock/productos/?search=${searchTerm}`)
                .then(data => setSearchResults(data.results || data))
                .catch(() => toast.error("Error al buscar productos."))
                .finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (clienteSearchTerm.trim().length < 2) {
            setClienteResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            apiClient(`/api/fidelizacion/clientes/?search=${clienteSearchTerm}`)
                .then(data => setClienteResults(data.results || data))
                .catch(() => toast.error("Error al buscar clientes."));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [clienteSearchTerm]);
    
    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const itemExistente = prev.find(item => item.id_producto === producto.id_producto);
            if (itemExistente) {
                return prev.map(item => item.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item);
            } else {
                return [...prev, { ...producto, cantidad: 1 }];
            }
        });
        setSearchTerm('');
        setSearchResults([]);
        searchInputRef.current?.focus();
    };

    const eliminarDelCarrito = (productoId) => {
        setCarrito(prev => prev.filter(item => item.id_producto !== productoId));
    };
    
    const cambiarCantidad = (productoId, cambio) => {
        setCarrito(prev => prev.map(item => item.id_producto === productoId ? { ...item, cantidad: Math.max(1, item.cantidad + cambio) } : item).filter(item => item.cantidad > 0));
    };

    const totalCarrito = useMemo(() => {
        return carrito.reduce((total, item) => total + item.precio_unitario_venta_producto * item.cantidad, 0);
    }, [carrito]);

    const procesarVenta = async (metodoPago) => {
        setShowPaymentModal(false);
        if (carrito.length === 0) return toast.error("El carrito está vacío.");
        if (!user?.empleado_id) return toast.error("No se pudo identificar al empleado.");
        if (!cajaId) return toast.error("No hay caja abierta.");
        if (!clienteGenericoId) return toast.error("No se encontró cliente genérico.");
        if (!estadoVentaId) return toast.error("No se encontró estado de venta.");

        setLoading(true);
        const processingToast = toast.loading(`Registrando venta...`);

        const datosVenta = {
            detalles: carrito.map(item => ({
                producto: parseInt(item.id_producto),
                cantidad: parseInt(item.cantidad),
                precio_unitario: parseFloat(item.precio_unitario_venta_producto),
            })),
            total_venta: parseFloat(totalCarrito.toFixed(2)),
            empleado_venta: parseInt(user.empleado_id),
            cliente_venta: clienteSeleccionado ? parseInt(clienteSeleccionado.id_cliente) : parseInt(clienteGenericoId),
            caja_venta: parseInt(cajaId),
            estado_venta: parseInt(estadoVentaId),
            metodo_pago: metodoPago,
            observaciones_venta: clienteSeleccionado ? `Venta a ${clienteSeleccionado.user_cliente.first_name}` : 'Venta sin cliente',
        };

        console.log('Datos a enviar:', datosVenta);
        
        try {
            const response = await apiClient('/api/ventas/ventas/', { method: 'POST', body: JSON.stringify(datosVenta) });
            toast.success("¡Venta registrada con éxito!", { id: processingToast });
            const qrData = {
                qr_token: response.qr_token || `VENTA-ID-${response.id_venta}`,
                total_venta: totalCarrito,
            };
            setVentaFinalizadaData(qrData);
        } catch (err) {
            console.error('Error completo:', err);
            const errorDetail = err.data?.detail || (err.data && Object.values(err.data).flat().join(' ')) || 'Error al registrar la venta.';
            toast.error(errorDetail, { id: processingToast });
        } finally {
            setLoading(false);
        }
    };
    
    const iniciarNuevaVenta = () => {
        setCarrito([]);
        setVentaFinalizadaData(null);
        setSearchTerm('');
        setClienteSeleccionado(null);
        setClienteSearchTerm('');
        searchInputRef.current?.focus();
    };

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="flex h-screen bg-pr-dark-gray font-sans text-white overflow-hidden">
            <QrModal ventaData={ventaFinalizadaData} onNuevaVenta={iniciarNuevaVenta} />
            <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={procesarVenta} total={totalCarrito} />

            <div className="w-1/2 flex flex-col p-6">
                <div className="relative mb-6">
                    <input ref={searchInputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o escanear código..." className="w-full p-4 pl-12 bg-pr-dark border-2 border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-pr-yellow"/>
                    <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {isSearching ? <div className="text-center py-10 text-pr-gray">Buscando...</div> : searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {searchResults.map(p => (
                                <div key={p.id_producto} onClick={() => agregarAlCarrito(p)} className="bg-pr-dark rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:ring-2 ring-pr-yellow">
                                    <img src={p.image || 'https://via.placeholder.com/150'} alt={p.nombre_producto} className="w-24 h-24 object-cover rounded-lg mb-3" />
                                    <p className="font-semibold text-sm leading-tight mb-1">{p.nombre_producto}</p>
                                    <p className="font-bold text-pr-yellow text-lg">{formatCurrency(p.precio_unitario_venta_producto)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Stock: {p.total_stock || 0}</p>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-center py-10 text-gray-600"><p>Busca un producto para empezar.</p></div>}
                </div>
            </div>

            <div className="w-1/2 bg-pr-dark flex flex-col p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                    <h2 className="text-3xl font-bold text-pr-yellow flex items-center gap-3"><FontAwesomeIcon icon={faShoppingCart} /> Venta Actual</h2>
                    {carrito.length > 0 && <button onClick={() => setCarrito([])} className="text-sm text-red-500 hover:underline">Vaciar Carrito</button>}
                </div>

                <div className="flex-grow overflow-y-auto">
                    {carrito.length === 0 ? <div className="flex items-center justify-center h-full text-gray-600"><p>El carrito está vacío</p></div> : (
                        <div className="space-y-4">
                            {carrito.map(item => (
                                <div key={item.id_producto} className="flex items-center gap-4 bg-pr-dark-gray p-3 rounded-lg">
                                    <img src={item.image || 'https://via.placeholder.com/150'} alt={item.nombre_producto} className="w-16 h-16 object-cover rounded-md"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.nombre_producto}</p>
                                        <p className="text-sm text-gray-400">{formatCurrency(item.precio_unitario_venta_producto)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-pr-dark p-1 rounded-lg">
                                        <button onClick={() => cambiarCantidad(item.id_producto, -1)} className="text-white w-8 h-8 rounded hover:bg-gray-700"><FontAwesomeIcon icon={faMinus}/></button>
                                        <span className="font-bold text-lg w-8 text-center">{item.cantidad}</span>
                                        <button onClick={() => cambiarCantidad(item.id_producto, 1)} className="text-white w-8 h-8 rounded hover:bg-gray-700"><FontAwesomeIcon icon={faPlus}/></button>
                                    </div>
                                    <p className="font-bold w-28 text-right text-lg">{formatCurrency(item.precio_unitario_venta_producto * item.cantidad)}</p>
                                    <button onClick={() => eliminarDelCarrito(item.id_producto)} className="text-gray-500 hover:text-red-500 w-8 h-8"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-gray-700 space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Asociar Cliente (Opcional)</label>
                        <input type="text" placeholder="Buscar cliente por nombre o DNI..." value={clienteSeleccionado ? `${clienteSeleccionado.user_cliente.first_name} ${clienteSeleccionado.user_cliente.last_name}` : clienteSearchTerm} onChange={(e) => { if (clienteSeleccionado) setClienteSeleccionado(null); setClienteSearchTerm(e.target.value); }} className="w-full p-3 bg-pr-dark-gray border border-gray-600 rounded-lg" />
                        {clienteSearchTerm && !clienteSeleccionado && clienteResults.length > 0 && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-pr-dark border border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {clienteResults.map(cliente => (
                                    <div key={cliente.id_cliente} onClick={() => { setClienteSeleccionado(cliente); setClienteSearchTerm(''); setClienteResults([]); }} className="p-3 cursor-pointer hover:bg-pr-dark-gray">
                                        {cliente.user_cliente.first_name} {cliente.user_cliente.last_name} ({cliente.dni_cliente})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold">
                        <span className="text-gray-400">Subtotal:</span>
                        <span>{formatCurrency(totalCarrito)}</span>
                    </div>
                    <div className="flex justify-between items-center text-4xl font-bold">
                        <span className="text-pr-yellow">TOTAL:</span>
                        <span className="text-pr-yellow">{formatCurrency(totalCarrito)}</span>
                    </div>
                    <button onClick={() => setShowPaymentModal(true)} disabled={loading || carrito.length === 0 || !cajaId} className="w-full bg-pr-yellow text-pr-dark font-bold text-xl py-4 rounded-lg hover:bg-opacity-90 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                        {loading ? 'Procesando...' : !cajaId ? 'Sin caja abierta' : 'Cobrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VentasPOS;
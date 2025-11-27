// =================================================================================================
// --- IMPORTACIONES ---
// =================================================================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faShoppingCart, faTrash, faPlus, faMinus, faMoneyBillWave, 
    faCreditCard, faUniversity, faTimes // <-- AÑADIDO faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useCajaContext } from '@/hooks/useCaja'; 

// =================================================================================================
// --- SUB-COMPONENTE: MODAL DE QR (Sin cambios) ---
// =================================================================================================
const QrModal = ({ ventaData, onNuevaVenta }) => {
    if (!ventaData) return null;
    const PESOS_POR_PUNTO = 10; // Ajustar si quieres otra regla (1 punto cada X pesos)
    const puntosGanados = Math.floor(Number(ventaData.total_venta || 0) / PESOS_POR_PUNTO);

    // Generar URL completa que el cliente escaneará (apunta al endpoint público de backend)
    const token = ventaData.qr_token;
    const base = window.location.origin;
    const qrUrl = `${base}/api/fidelizacion/load_points_qr/?token=${encodeURIComponent(token)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-pr-dark text-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
                <h2 className="text-2xl font-bold mb-2 text-pr-yellow">¡Venta Registrada con Éxito!</h2>
                <p className="text-gray-400 mb-6">El cliente puede escanear este QR para sumar sus puntos.</p>
                <div className="flex justify-center mb-6 p-4 bg-white rounded-lg">
                    <QRCodeSVG value={qrUrl} size={256} />
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

// =================================================================================================
// --- SUB-COMPONENTE: MODAL DE PAGO (Versión Completa) ---
// =================================================================================================
const PaymentModal = ({ isOpen, onClose, onConfirm, total }) => {
    // Estado para el método de pago (efectivo, tarjeta, transferencia)
    const [metodoSeleccionado, setMetodoSeleccionado] = useState('efectivo');
    // Estado para el monto que entrega el cliente
    const [montoRecibido, setMontoRecibido] = useState('');

    // Reseteamos el estado del modal cada vez que se abre
    useEffect(() => {
        if (isOpen) {
            setMontoRecibido('');
            setMetodoSeleccionado('efectivo');
        }
    }, [isOpen]);

    const totalFloat = parseFloat(total) || 0;

    // Cálculo del vuelto, solo para efectivo
    const vuelto = useMemo(() => {
        const recibido = parseFloat(montoRecibido);
        if (metodoSeleccionado !== 'efectivo' || isNaN(recibido) || recibido < totalFloat) {
            return 0;
        }
        return recibido - totalFloat;
    }, [montoRecibido, totalFloat, metodoSeleccionado]);

    // Variable para saber si el botón de confirmar (en efectivo) debe estar activo
    const puedePagarEfectivo = parseFloat(montoRecibido) >= totalFloat;

    // Función de utilidad para formatear
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Handler para el botón principal de confirmación
    const handleConfirmar = () => {
        // Validación final
        if (metodoSeleccionado === 'efectivo' && !puedePagarEfectivo) {
            toast.error('El monto recibido es menor que el total.');
            return; 
        }
        // Llama a 'procesarVenta' en el padre con el método seleccionado
        onConfirm(metodoSeleccionado);
    };

    if (!isOpen) return null;

    // --- Renderizado Condicional del Panel Derecho ---
    const renderDetailsPanel = () => {
        switch (metodoSeleccionado) {
            case 'efectivo':
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-white">Pago en Efectivo</h3>
                        <div>
                            <label htmlFor="montoRecibido" className="block text-sm font-medium text-gray-400 mb-2">Monto Recibido</label>
                            <input
                                type="number"
                                id="montoRecibido"
                                value={montoRecibido}
                                onChange={(e) => setMontoRecibido(e.target.value)}
                                className="w-full p-4 bg-pr-dark-gray border border-gray-600 rounded-lg text-white text-2xl font-mono focus:ring-pr-yellow focus:border-pr-yellow"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between items-center text-3xl">
                            <span className="text-gray-400">Vuelto:</span>
                            <span className="text-pr-yellow font-bold">${formatCurrency(vuelto)}</span>
                        </div>
                        <button 
                            onClick={handleConfirmar} 
                            disabled={!puedePagarEfectivo}
                            className="w-full bg-green-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            Confirmar Venta en Efectivo
                        </button>
                    </div>
                );
            case 'tarjeta':
                return (
                    <div className="space-y-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-semibold text-white">Pago con Tarjeta</h3>
                        <FontAwesomeIcon icon={faCreditCard} className="text-6xl text-pr-orange my-10" />
                        <p className="text-gray-400 text-lg">Confirme el pago en la terminal (Posnet/MercadoPago).</p>
                        <button 
                            onClick={handleConfirmar} 
                            className="w-full bg-pr-orange text-pr-dark font-bold text-xl py-4 rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                            Confirmar Venta con Tarjeta
                        </button>
                    </div>
                );
            case 'transferencia':
                 return (
                    <div className="space-y-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-semibold text-white">Pago con Transferencia</h3>
                        <FontAwesomeIcon icon={faUniversity} className="text-6xl text-purple-400 my-10" />
                        <p className="text-gray-400 text-lg">Confirme la recepción de la transferencia (Alias/CBU).</p>
                        <button 
                            onClick={handleConfirmar} 
                            className="w-full bg-purple-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-purple-700"
                        >
                            Confirmar Venta por Transferencia
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- Estructura del Modal ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-pr-dark text-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700 overflow-hidden">
                {/* Encabezado */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-3xl font-bold text-white">Resumen de Pago</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {/* Cuerpo (2 columnas) */}
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Columna Izquierda (Selector) */}
                    <div className="md:col-span-1 border-r border-gray-700 p-6">
                        <p className="text-lg text-gray-400 mb-2">Total a Pagar:</p>
                        <p className="text-5xl font-bold text-pr-yellow mb-8">${formatCurrency(totalFloat)}</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setMetodoSeleccionado('efectivo')}
                                className={`w-full flex items-center p-4 rounded-lg text-lg font-semibold transition-colors ${metodoSeleccionado === 'efectivo' ? 'bg-pr-yellow text-pr-dark' : 'bg-pr-dark-gray hover:bg-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-3 w-6" /> Efectivo
                            </button>
                            <button 
                                onClick={() => setMetodoSeleccionado('tarjeta')}
                                className={`w-full flex items-center p-4 rounded-lg text-lg font-semibold transition-colors ${metodoSeleccionado === 'tarjeta' ? 'bg-pr-yellow text-pr-dark' : 'bg-pr-dark-gray hover:bg-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faCreditCard} className="mr-3 w-6" /> Tarjeta
                            </button>
                            <button 
                                onClick={() => setMetodoSeleccionado('transferencia')}
                                className={`w-full flex items-center p-4 rounded-lg text-lg font-semibold transition-colors ${metodoSeleccionado === 'transferencia' ? 'bg-pr-yellow text-pr-dark' : 'bg-pr-dark-gray hover:bg-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faUniversity} className="mr-3 w-6" /> Transferencia
                            </button>
                        </div>
                    </div>

                    {/* Columna Derecha (Detalles) */}
                    <div className="md:col-span-2 p-8">
                        {renderDetailsPanel()}
                    </div>
                </div>
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

// =================================================================================================
// --- COMPONENTE PRINCIPAL: VENTAS TPV (Refactorizado con Axios) ---
// =================================================================================================
const VentasPOS = () => {
    // --- HOOKS Y CONTEXTOS (Sin cambios) ---
    const { user } = useAuth();
    const { cashStatus, refreshData: refreshCajaData } = useCajaContext();
    const cajaId = cashStatus.data?.id_caja;
    const isCajaOpen = cashStatus.isOpen;
    
    // --- ESTADOS LOCALES (Sin cambios) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ventaFinalizadaData, setVentaFinalizadaData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const searchInputRef = useRef(null);
    const procesandoRef = useRef(false);
    const [clienteSearchTerm, setClienteSearchTerm] = useState('');
    const [clienteResults, setClienteResults] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [clienteGenericoId, setClienteGenericoId] = useState(null);
    const [estadoVentaId, setEstadoVentaId] = useState(null);

    // --- EFECTOS SECUNDARIOS (useEffect) ---

    // 1. Carga de configuración inicial.
    useEffect(() => {
        const cargarConfiguracion = async () => {
            try {
                // --- CAMBIO 1: Sintaxis Axios GET con params ---
                const responseClientes = await apiClient.get('/fidelizacion/clientes/', {
                    params: { dni_cliente: '00000000' }
                });
                const clientes = responseClientes.data.results || responseClientes.data;
                if (clientes && clientes.length > 0) {
                    setClienteGenericoId(clientes[0].id_cliente);
                } else {
                    toast.error('No se encontró cliente genérico.');
                }

                // --- CAMBIO 2: Sintaxis Axios GET con params ---
                const responseEstados = await apiClient.get('/estados/', {
                    params: { nombre_estado: 'COMPLETADA' }
                });
                const estados = responseEstados.data.results || responseEstados.data;
                if (estados && estados.length > 0) {
                    setEstadoVentaId(estados[0].id_estado);
                } else {
                    toast.error('No se encontró estado COMPLETADA.');
                }
            } catch (error) {
                // --- CAMBIO 3: Manejo de error de Axios ---
                const errorMsg = error.response?.data?.detail || 'Error al cargar configuración';
                console.error('Error cargando configuración:', error);
                toast.error(errorMsg);
            }
        };
        cargarConfiguracion();
    }, []);

    // 2. Búsqueda de productos con "Debounce".
    useEffect(() => {
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            // --- CAMBIO 4: Sintaxis Axios GET con params y .then() ---
            apiClient.get(`/stock/productos/`, { params: { search: searchTerm } })
                .then(response => setSearchResults(response.data.results || response.data)) 
                .catch(() => toast.error("Error al buscar productos."))
                .finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 3. Búsqueda de clientes con "Debounce".
    useEffect(() => {
        if (clienteSearchTerm.trim().length < 2) {
            setClienteResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            // --- CAMBIO 5: Sintaxis Axios GET con params y .then() ---
            apiClient.get(`/fidelizacion/clientes/`, { params: { search: clienteSearchTerm } })
                .then(response => setClienteResults(response.data.results || response.data)) 
                .catch(() => toast.error("Error al buscar clientes."));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [clienteSearchTerm]);
    
    // --- FUNCIONES DE MANEJO DEL CARRITO (Sin cambios) ---

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
        setCarrito(prev => prev.map(item => 
            item.id_producto === productoId 
            ? { ...item, cantidad: Math.max(1, item.cantidad + cambio) } 
            : item
        ).filter(item => item.cantidad > 0)); 
    };

    const totalCarrito = useMemo(() => {
        return carrito.reduce((total, item) => total + (item.precio_unitario_venta_producto || 0) * (item.cantidad || 0), 0);
    }, [carrito]);

    // --- LÓGICA PRINCIPAL: PROCESAR LA VENTA ---

    const procesarVenta = async (metodoPago) => {

        // Evitar cierre del modal antes de validar y prevenir envíos dobles
        if (procesandoRef.current) return;

        // --- Validaciones previas (Sin cambios) ---
        if (carrito.length === 0) return toast.error("El carrito está vacío.");
        if (!user?.empleado_id) return toast.error("No se pudo identificar al empleado.");
        if (!isCajaOpen || !cajaId) return toast.error("No hay caja abierta.");
        if (!clienteGenericoId) return toast.error("No se encontró cliente genérico.");
        if (!estadoVentaId) return toast.error("No se encontró estado de venta.");

        // Si pasaron las validaciones, cerramos el modal y marcamos que estamos procesando
        setShowPaymentModal(false);
        setLoading(true);
        if (!procesandoRef.current) procesandoRef.current = true;
        const processingToast = toast.loading(`Registrando venta...`);

        // Construcción del payload (Sin cambios)
        // Helper: obtener nombre legible del cliente (soporta varias formas de respuesta)
        const getClienteDisplayName = (cli) => {
            if (!cli) return '';
            return (
                cli.user_cliente?.first_name ||
                cli.user_first_name ||
                cli.user?.first_name ||
                cli.first_name ||
                cli.nombre_cliente ||
                cli.nombre ||
                ''
            );
        };

        const datosVenta = {
            detalles: carrito.map(item => ({
                producto: parseInt(item.id_producto),
                cantidad: parseInt(item.cantidad),
                precio_unitario: parseFloat(item.precio_unitario_venta_producto),
            })),
            total_venta: parseFloat(totalCarrito.toFixed(2)),
            empleado_venta: parseInt(user.empleado_id),
            cliente_venta: clienteSeleccionado ? parseInt(clienteSeleccionado.id_cliente || clienteSeleccionado.id) : parseInt(clienteGenericoId),
            caja_venta: parseInt(cajaId),
            estado_venta: parseInt(estadoVentaId),
            metodo_pago: metodoPago,
            observaciones_venta: clienteSeleccionado ? `Venta a ${getClienteDisplayName(clienteSeleccionado)}` : 'Venta sin cliente',
        };
        
        try {
            // --- CAMBIO 6: Sintaxis Axios POST ---
            const response = await apiClient.post('/ventas/ventas/', datosVenta);
            
            // --- CAMBIO 7: Acceso a datos de respuesta de Axios ---
            const responseData = response.data;

            // Actualizamos la caja en cualquier caso si la API devolvió ok (por seguridad)
            try { refreshCajaData(); } catch (e) { console.warn('No se pudo refrescar caja:', e); }
            toast.success(metodoPago === 'efectivo' ? "¡Venta registrada y caja actualizada!" : "¡Venta registrada con éxito!", { id: processingToast });

            const qrData = {
                qr_token: responseData.qr_token || `VENTA-ID-${responseData.id_venta}`,
                total_venta: totalCarrito,
            };
            setVentaFinalizadaData(qrData);
        
        } catch (err) {
            // --- CAMBIO 8: Manejo de error de Axios ---
            const errorDetail = err.response?.data?.detail || (err.response?.data && Object.values(err.response.data).flat().join(' ')) || 'Error al registrar la venta.';
            toast.error(errorDetail, { id: processingToast });
        
        } finally {
            setLoading(false);
            procesandoRef.current = false;
        }
    };
    
    // --- Resto de funciones y render (Sin cambios) ---

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

    const formatCurrency = (value) => `${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // =================================================================================================
    // --- RENDERIZADO DEL COMPONENTE (JSX) ---
    // =================================================================================================
    return (
        <div className="flex h-screen bg-pr-dark-gray font-sans text-white overflow-hidden">
            {/* --- Modales --- */}
            <QrModal ventaData={ventaFinalizadaData} onNuevaVenta={iniciarNuevaVenta} />
            <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={procesarVenta} total={totalCarrito} />

            {/* --- Columna Izquierda (Búsqueda y Productos) --- */}
            <div className="w-3/5 flex flex-col p-6">
                {/* Input de Búsqueda de Productos */}
                <div className="relative mb-4">
                    <input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar producto por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-4 bg-pr-dark border border-gray-700 rounded-lg text-white"
                    />
                    {/* Resultados de Búsqueda de Productos */}
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-pr-dark border border-gray-700 rounded-lg mt-1 max-h-60 overflow-y-auto">
                            {searchResults.map(prod => (
                                <li 
                                    key={prod.id_producto} 
                                    onClick={() => agregarAlCarrito(prod)}
                                    className="p-3 hover:bg-pr-dark-gray cursor-pointer"
                                >
                                    {prod.nombre_producto} ({formatCurrency(prod.precio_unitario_venta_producto)})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* (Aquí iría tu lista de productos o categorías si la tienes) */}
            </div>

            {/* --- Columna Derecha (Carrito y Finalización) --- */}
            <div className="w-2/5 bg-pr-dark flex flex-col p-6 shadow-2xl">
                {/* Input de Búsqueda de Cliente */}
                <div className="relative mb-4">
                    <input 
                        type="text"
                        placeholder="Buscar cliente (DNI, Nombre) o dejar vacío para Genérico"
                        value={clienteSearchTerm}
                        onChange={(e) => setClienteSearchTerm(e.target.value)}
                        className="w-full p-3 bg-pr-dark-gray border border-gray-700 rounded-lg text-white text-sm"
                    />
                    {/* Resultados de Búsqueda de Cliente */}
                    {clienteResults.length > 0 && !clienteSeleccionado && (
                        <ul className="absolute z-10 w-full bg-pr-dark border border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto">
                            {clienteResults.map(cli => (
                                <li 
                                    key={cli.id_cliente} 
                                    onClick={() => {
                                        setClienteSeleccionado(cli);
                                        setClienteSearchTerm(`${cli.user_first_name} ${cli.user_last_name}`);
                                        setClienteResults([]);
                                    }}
                                    className="p-3 hover:bg-pr-dark-gray cursor-pointer text-sm"
                                >
                                    {cli.user_first_name} {cli.user_last_name} (DNI: {cli.dni_cliente})
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* Cliente Seleccionado */}
                    {clienteSeleccionado && (
                        <div className="flex justify-between items-center p-2 bg-pr-dark-gray rounded-lg mt-2">
                            <span className="text-sm text-pr-yellow">{clienteSeleccionado.user_first_name} {clienteSeleccionado.user_last_name}</span>
                            <button onClick={() => { setClienteSeleccionado(null); setClienteSearchTerm(''); }} className="text-red-500 text-xs">Quitar</button>
                        </div>
                    )}
                </div>

                {/* Carrito */}
                <h2 className="text-2xl font-bold mb-4">Carrito <FontAwesomeIcon icon={faShoppingCart} /></h2>
                <div className="flex-grow overflow-y-auto mb-4 border-t border-b border-gray-700 divide-y divide-gray-700">
                    {carrito.length === 0 ? (
                        <p className="text-gray-400 text-center p-10">El carrito está vacío</p>
                    ) : (
                        carrito.map(item => (
                            <div key={item.id_producto} className="flex items-center justify-between p-3">
                                <div>
                                    <p className="font-bold text-white">{item.nombre_producto}</p>
                                    <p className="text-sm text-gray-400">{formatCurrency(item.precio_unitario_venta_producto)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 border border-gray-700 rounded-lg">
                                        <button onClick={() => cambiarCantidad(item.id_producto, -1)} className="px-2 py-1 text-pr-yellow"><FontAwesomeIcon icon={faMinus} /></button>
                                        <span className="font-bold px-2">{item.cantidad}</span>
                                        <button onClick={() => cambiarCantidad(item.id_producto, 1)} className="px-2 py-1 text-pr-yellow"><FontAwesomeIcon icon={faPlus} /></button>
                                    </div>
                                    <button onClick={() => eliminarDelCarrito(item.id_producto)} className="text-red-500 hover:text-red-400">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Total */}
                <div className="py-4">
                    <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Total:</span>
                        <span className="text-pr-yellow">{formatCurrency(totalCarrito)}</span>
                    </div>
                </div>

                {/* Advertencia de Caja Cerrada */}
                {!isCajaOpen && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mx-0 mb-4 text-center">
                        <p className="font-bold text-lg">Caja Cerrada</p>
                        <p className="text-sm">No se pueden registrar ventas. Dirígete a la sección "Caja" para abrirla.</p>
                    </div>
                )}

                {/* Botón de Cobrar */}
                <button 
                    onClick={() => setShowPaymentModal(true)} 
                    disabled={loading || carrito.length === 0 || !isCajaOpen}
                    className="btn-primary-lg w-full disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? 'Procesando...' : !isCajaOpen ? 'Caja Cerrada' : 'Cobrar'}
                </button>
            </div>
        </div>
    );
};

export default VentasPOS;
// =================================================================================================
// --- IMPORTACIONES ---
// =================================================================================================
// Importamos las herramientas básicas de React para manejar el estado, los efectos secundarios, etc.
import React, { useState, useEffect, useMemo, useRef } from 'react';
// PropTypes nos ayuda a validar que los componentes reciban las props del tipo correcto.
import PropTypes from 'prop-types';
// Nuestro cliente API centralizado para comunicarnos con el backend de Django.
import apiClient from '@/api/apiClient';
// Una librería para mostrar notificaciones (ej. "Venta exitosa", "Error").
import { toast } from 'react-hot-toast';
// Componente para generar el código QR de la venta.
import { QRCodeSVG } from 'qrcode.react';
// Hook personalizado para acceder a la información del usuario autenticado.
import { useAuth } from '@/hooks/useAuth';
// Iconos para mejorar la interfaz visual.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faTrash, faPlus, faMinus, faMoneyBillWave, faCreditCard, faUniversity } from '@fortawesome/free-solid-svg-icons';
// Hook para acceder al contexto de la caja (saber si está abierta, su ID, etc.).
import { useCajaContext } from '@/contexts/CajaContext';

// =================================================================================================
// --- SUB-COMPONENTE: MODAL DE QR ---
// Se muestra al finalizar una venta con éxito.
// =================================================================================================
const QrModal = ({ ventaData, onNuevaVenta }) => {
    // Si no hay datos de la venta, no se muestra nada.
    if (!ventaData) return null;
    // Cálculo simple de puntos ganados por el cliente.
    const puntosGanados = Math.floor(ventaData.total_venta / 1000);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-pr-dark text-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
                <h2 className="text-2xl font-bold mb-2 text-pr-yellow">¡Venta Registrada con Éxito!</h2>
                <p className="text-gray-400 mb-6">El cliente puede escanear este QR para sumar sus puntos.</p>
                {/* El QR necesita un fondo blanco para ser legible por las cámaras. */}
                <div className="flex justify-center mb-6 p-4 bg-white rounded-lg">
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

// Definimos los tipos de las props para QrModal para evitar errores.
QrModal.propTypes = {
    ventaData: PropTypes.shape({
        total_venta: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        qr_token: PropTypes.string.isRequired,
    }),
    onNuevaVenta: PropTypes.func.isRequired,
};

// =================================================================================================
// --- SUB-COMPONENTE: MODAL DE PAGO ---
// Se muestra al hacer clic en "Cobrar". Permite elegir el método de pago.
// =================================================================================================
const PaymentModal = ({ isOpen, onClose, onConfirm, total }) => {
    const [montoRecibido, setMontoRecibido] = useState('');
    
    // `useMemo` optimiza el cálculo del vuelto. Solo se recalcula si `montoRecibido` o `total` cambian.
    const vuelto = useMemo(() => {
        const recibido = parseFloat(montoRecibido);
        if (!isNaN(recibido) && recibido >= total) {
            return recibido - total;
        }
        return 0;
    }, [montoRecibido, total]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-pr-dark text-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700">
                {/* ... resto del JSX del modal de pago ... */}
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
// --- COMPONENTE PRINCIPAL: VENTAS TPV (Terminal Punto de Venta) ---
// =================================================================================================
const VentasPOS = () => {
    // --- HOOKS Y CONTEXTOS ---
    // Obtenemos datos del usuario logueado (ej. su ID de empleado).
    const { user } = useAuth();
    // Obtenemos el estado de la caja (si está abierta, su ID) y la función para refrescar sus datos.
    // Este es el poder del Contexto: el TPV no sabe *cómo* se abre o cierra la caja, solo consume su estado.
    const { cashStatus, refreshData: refreshCajaData } = useCajaContext();
    
    // Extraemos las variables del contexto para un uso más limpio.
    const cajaId = cashStatus.data?.id_caja;
    const isCajaOpen = cashStatus.isOpen;
    
    // --- ESTADOS LOCALES DEL COMPONENTE ---
    // Estados para la búsqueda de productos.
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    // Estado para el carrito de compras. Es un array de objetos de producto.
    const [carrito, setCarrito] = useState([]);
    // Estados para controlar la UI (modales, cargas).
    const [loading, setLoading] = useState(false); // Para deshabilitar botones mientras se procesa una venta.
    const [ventaFinalizadaData, setVentaFinalizadaData] = useState(null); // Guarda datos para el modal QR.
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    // `useRef` para acceder directamente al input de búsqueda (ej. para hacer focus).
    const searchInputRef = useRef(null);

    // Estados para la búsqueda y selección de clientes.
    const [clienteSearchTerm, setClienteSearchTerm] = useState('');
    const [clienteResults, setClienteResults] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    // Estados para IDs de configuración que se obtienen al cargar.
    const [clienteGenericoId, setClienteGenericoId] = useState(null);
    const [estadoVentaId, setEstadoVentaId] = useState(null);

    // --- EFECTOS SECUNDARIOS (useEffect) ---

    // 1. Carga de configuración inicial.
    // Se ejecuta solo una vez cuando el componente se monta gracias al array de dependencias vacío `[]`.
    useEffect(() => {
        const cargarConfiguracion = async () => {
            try {
                // Ya no necesitamos buscar la caja manualmente, el `CajaContext` nos la provee.

                // Obtenemos el ID del cliente "genérico" para ventas sin cliente específico.
                const responseClientes = await apiClient('/api/fidelizacion/clientes/?dni_cliente=00000000');
                const clientes = responseClientes.results || responseClientes;
                if (clientes && clientes.length > 0) {
                    setClienteGenericoId(clientes[0].id_cliente);
                } else {
                    toast.error('No se encontró cliente genérico.');
                }

                // Obtenemos el ID del estado "COMPLETADA" para marcar las ventas.
                const responseEstados = await apiClient('/api/estados/?nombre_estado=COMPLETADA');
                const estados = responseEstados.results || responseEstados;
                if (estados && estados.length > 0) {
                    setEstadoVentaId(estados[0].id_estado);
                } else {
                    toast.error('No se encontró estado COMPLETADA.');
                }
            } catch (error) {
                console.error('Error cargando configuración:', error);
                toast.error('Error al cargar configuración');
            }
        };
        cargarConfiguracion();
    }, []);

    // 2. Búsqueda de productos con "Debounce".
    // Este efecto se ejecuta cada vez que `searchTerm` cambia.
    useEffect(() => {
        // Si la búsqueda es muy corta, no hacemos nada.
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        // "Debouncing": esperamos 300ms después de que el usuario deja de teclear para lanzar la búsqueda.
        // Esto evita hacer una llamada a la API por cada letra tecleada.
        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            apiClient(`/api/stock/productos/?search=${searchTerm}`)
                .then(data => setSearchResults(data.results || data))
                .catch(() => toast.error("Error al buscar productos."))
                .finally(() => setIsSearching(false));
        }, 300);
        // La función de limpieza se ejecuta si el usuario vuelve a teclear antes de los 300ms, cancelando el timeout anterior.
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 3. Búsqueda de clientes con "Debounce" (misma lógica que para productos).
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
    
    // --- FUNCIONES DE MANEJO DEL CARRITO ---

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const itemExistente = prev.find(item => item.id_producto === producto.id_producto);
            if (itemExistente) {
                // Si el producto ya está, incrementamos su cantidad.
                return prev.map(item => item.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item);
            } else {
                // Si es nuevo, lo añadimos al carrito con cantidad 1.
                return [...prev, { ...producto, cantidad: 1 }];
            }
        });
        // Limpiamos la búsqueda y hacemos focus en el input para la siguiente búsqueda.
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
            ? { ...item, cantidad: Math.max(1, item.cantidad + cambio) } // La cantidad mínima es 1.
            : item
        ).filter(item => item.cantidad > 0)); // Asegura que no queden items con cantidad 0.
    };

    // `useMemo` para optimizar el cálculo del total. Solo se recalcula si el `carrito` cambia.
    const totalCarrito = useMemo(() => {
        return carrito.reduce((total, item) => total + item.precio_unitario_venta_producto * item.cantidad, 0);
    }, [carrito]);

    // --- LÓGICA PRINCIPAL: PROCESAR LA VENTA ---

    const procesarVenta = async (metodoPago) => {
        setShowPaymentModal(false); // Cerramos el modal de pago.

        // --- Validaciones previas ---
        if (carrito.length === 0) return toast.error("El carrito está vacío.");
        if (!user?.empleado_id) return toast.error("No se pudo identificar al empleado.");
        // Usamos el estado del contexto para validar la caja.
        if (!isCajaOpen || !cajaId) return toast.error("No hay caja abierta.");
        if (!clienteGenericoId) return toast.error("No se encontró cliente genérico.");
        if (!estadoVentaId) return toast.error("No se encontró estado de venta.");

        setLoading(true); // Bloqueamos la UI.
        const processingToast = toast.loading(`Registrando venta...`);

        // Construimos el objeto de datos que enviaremos al backend.
        // Debe coincidir con lo que espera el `VentaWriteSerializer` de Django.
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
        
        try {
            // Enviamos la petición POST al backend.
            const response = await apiClient('/api/ventas/ventas/', { method: 'POST', body: JSON.stringify(datosVenta) });

            // --- ¡LA MAGIA DEL CONTEXTO! ---
            // Si el pago fue en efectivo, la caja cambió. Llamamos a `refreshCajaData`
            // para que el `CajaContext` se actualice. Cualquier otro componente que
            // consuma este contexto (como el header) se actualizará automáticamente.
            if (metodoPago === 'efectivo') {
                refreshCajaData(); 
                toast.success("¡Venta registrada y caja actualizada!", { id: processingToast });
            } else {
                toast.success("¡Venta registrada con éxito!", { id: processingToast });
            }

            // Preparamos los datos para el modal del QR y lo mostramos.
            const qrData = {
                qr_token: response.qr_token || `VENTA-ID-${response.id_venta}`,
                total_venta: totalCarrito,
            };
            setVentaFinalizadaData(qrData);
        } catch (err) {
            // Manejo de errores detallado.
            const errorDetail = err.data?.detail || (err.data && Object.values(err.data).flat().join(' ')) || 'Error al registrar la venta.';
            toast.error(errorDetail, { id: processingToast });
        } finally {
            setLoading(false); // Desbloqueamos la UI.
        }
    };
    
    // Resetea todos los estados para comenzar una nueva transacción.
    const iniciarNuevaVenta = () => {
        setCarrito([]);
        setVentaFinalizadaData(null);
        setSearchTerm('');
        setClienteSeleccionado(null);
        setClienteSearchTerm('');
        searchInputRef.current?.focus();
    };

    // Efecto para hacer focus en el input de búsqueda al cargar el componente.
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Función de utilidad para formatear los precios en formato de moneda local.
    const formatCurrency = (value) => `${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // =================================================================================================
    // --- RENDERIZADO DEL COMPONENTE (JSX) ---
    // =================================================================================================
    return (
        <div className="flex h-screen bg-pr-dark-gray font-sans text-white overflow-hidden">
            {/* Los modales están aquí, pero solo se muestran si su estado de visibilidad es `true` */}
            <QrModal ventaData={ventaFinalizadaData} onNuevaVenta={iniciarNuevaVenta} />
            <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={procesarVenta} total={totalCarrito} />

            {/* --- Columna Izquierda (Búsqueda y Productos) --- */}
            <div className="w-3/5 flex flex-col p-6">
                {/* ... */}
            </div>

            {/* --- Columna Derecha (Carrito y Finalización) --- */}
            <div className="w-2/5 bg-pr-dark flex flex-col p-6 shadow-2xl">
                {/* ... */}
                {/* Advertencia de Caja Cerrada: se muestra condicionalmente usando el estado del contexto. */}
                {!isCajaOpen && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mx-0 mb-4 text-center">
                        <p className="font-bold text-lg">Caja Cerrada</p>
                        <p className="text-sm">No se pueden registrar ventas. Dirígete a la sección "Caja" para abrirla.</p>
                    </div>
                )}
                {/* ... */}
                {/* Botón de Cobrar: se deshabilita si no se cumplen las condiciones (caja cerrada, carrito vacío, etc.). */}
                <button 
                    onClick={() => setShowPaymentModal(true)} 
                    disabled={loading || carrito.length === 0 || !isCajaOpen}
                    className="w-full bg-pr-yellow text-pr-dark font-bold text-xl py-4 rounded-lg hover:bg-opacity-90 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? 'Procesando...' : !isCajaOpen ? 'Caja Cerrada' : 'Cobrar'}
                </button>
                {/* ... */}
            </div>
        </div>
    );
};

export default VentasPOS;
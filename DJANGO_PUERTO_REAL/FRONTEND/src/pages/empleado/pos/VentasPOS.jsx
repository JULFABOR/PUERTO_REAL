import React, { useState, useEffect, useMemo, useRef } from 'react';
import apiClient from '../../../api/apiClient';
import { QRCodeSVG } from 'qrcode.react';

// --- Componente para el Pop-up del QR ---
const QrModal = ({ ventaData, onNuevaVenta }) => {
    if (!ventaData) return null;

    // Regla de negocio: 1 punto por cada $1000 gastados. Ajustar si es necesario.
    const puntosGanados = Math.floor(ventaData.total_venta / 1000);

    return (
        <div className="fixed inset-0 bg-pr-dark bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white text-pr-dark p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-2">¡Venta Realizada con Éxito!</h2>
                <p className="text-pr-gray mb-6">El cliente puede escanear este QR para sumar sus puntos.</p>
                
                <div className="flex justify-center mb-6 p-4 bg-gray-100 rounded-lg">
                    <QRCodeSVG 
                        value={ventaData.qr_token} 
                        size={256} 
                        bgColor="#ffffff" 
                        fgColor="#121212" 
                        level="H" 
                        includeMargin={true}
                    />
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

                <button 
                    onClick={onNuevaVenta}
                    className="w-full bg-pr-yellow text-pr-dark font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105"
                >
                    Nueva Venta
                </button>
            </div>
        </div>
    );
};


// --- Componente Principal del TPV ---
const VentasPOS = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ventaFinalizadaData, setVentaFinalizadaData] = useState(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        // Cargar solo los productos al iniciar
        const fetchProductos = async () => {
            try {
                const productosRes = await apiClient('/api/stock/productos/');
                setProductos(productosRes);
            } catch (err) {
                setError('No se pudieron cargar los productos.');
                console.error(err);
            }
        };
        fetchProductos();
        // Enfocar el campo de búsqueda al cargar
        searchInputRef.current?.focus();
    }, []);

    const productosFiltrados = useMemo(() => {
        if (!busqueda) return [];
        return productos.filter(p =>
            p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.barcode && p.barcode.includes(busqueda))
        ).slice(0, 10);
    }, [busqueda, productos]);

    const totalCarrito = useMemo(() => {
        return carrito.reduce((total, item) => total + parseFloat(item.precio_unitario_venta_producto) * item.cantidad, 0);
    }, [carrito]);

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const itemExistente = prev.find(item => item.id_producto === producto.id_producto);
            if (itemExistente) {
                return prev.map(item =>
                    item.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            } else {
                return [...prev, { ...producto, cantidad: 1 }];
            }
        });
        setBusqueda('');
        searchInputRef.current?.focus();
    };

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        const cantidad = parseInt(nuevaCantidad, 10);
        setCarrito(prev =>
            prev.map(item =>
                item.id_producto === productoId ? { ...item, cantidad: cantidad > 0 ? cantidad : 1 } : item
            )
        );
    };

    const eliminarDelCarrito = (productoId) => {
        setCarrito(prev => prev.filter(item => item.id_producto !== productoId));
    };

    const finalizarVenta = async () => {
        if (carrito.length === 0) {
            setError("El carrito está vacío.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Get user data from localStorage
            const userDataString = localStorage.getItem('userData');
            if (!userDataString) {
                throw new Error("No se encontraron datos de usuario. Por favor, inicie sesión de nuevo.");
            }
            const userData = JSON.parse(userDataString);
            if (!userData.employee_id) {
                throw new Error("El usuario no tiene un ID de empleado asociado.");
            }

            // 2. Get active caja status
            const cajaEstado = await apiClient('/api/caja/estado/');
            if (!cajaEstado || !cajaEstado.id_caja) {
                throw new Error("No hay una caja abierta. Por favor, abra una caja para poder registrar ventas.");
            }

            const datosVenta = {
                detalles: carrito.map(item => ({
                    producto_det_vent: item.id_producto,
                    cantidad_det_vent: item.cantidad,
                    precio_unitario_det_vent: item.precio_unitario_venta_producto,
                })),
                total_venta: totalCarrito,
                cliente_venta: null,
                empleado_venta: userData.employee_id,
                caja_venta: cajaEstado.id_caja,
            };

            const response = await apiClient('/api/ventas/ventas/', {
                method: 'POST',
                body: JSON.stringify(datosVenta),
            });
            setVentaFinalizadaData(response);
        } catch (err) {
            // The error from the try block could be a string I threw or an error from apiClient
            const errorMessage = err.message || 'Error al finalizar la venta. Verifique la consola.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const iniciarNuevaVenta = () => {
        setCarrito([]);
        setVentaFinalizadaData(null);
        setError(null);
        setBusqueda('');
        searchInputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-pr-dark-gray font-sans text-white">
            <QrModal ventaData={ventaFinalizadaData} onNuevaVenta={iniciarNuevaVenta} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* --- Columna Izquierda: Búsqueda y Carrito --- */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Buscador de Productos */}
                    <div className="bg-pr-dark p-6 rounded-2xl shadow-lg">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Escanear código de barras o buscar por nombre..."
                            className="w-full p-4 bg-pr-dark-gray border-2 border-pr-gray rounded-lg text-white text-lg focus:outline-none focus:border-pr-yellow transition-colors"
                        />
                        {busqueda && (
                            <div className="mt-4 bg-pr-dark rounded-lg max-h-60 overflow-y-auto">
                                {productosFiltrados.length > 0 ? (
                                    productosFiltrados.map(p => (
                                        <div
                                            key={p.id_producto}
                                            onClick={() => agregarAlCarrito(p)}
                                            className="p-4 cursor-pointer hover:bg-pr-dark-gray flex justify-between items-center transition-colors"
                                        >
                                            <span>{p.nombre_producto}</span>
                                            <span className="font-bold text-pr-yellow">${parseFloat(p.precio_unitario_venta_producto).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-pr-gray">No se encontraron productos</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Carrito */}
                    <div className="bg-pr-dark p-6 rounded-2xl shadow-lg flex-grow">
                        <h2 className="text-2xl font-bold mb-4 text-pr-yellow">Carrito de Compras</h2>
                        <div className="overflow-y-auto max-h-[60vh]">
                            {carrito.length === 0 ? (
                                <div className="text-center py-10 text-pr-gray">El carrito está vacío</div>
                            ) : (
                                carrito.map(item => (
                                    <div key={item.id_producto} className="flex items-center gap-4 mb-4 bg-pr-dark-gray p-3 rounded-lg">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.nombre_producto}</p>
                                            <p className="text-sm text-pr-gray">@ ${parseFloat(item.precio_unitario_venta_producto).toFixed(2)}</p>
                                        </div>
                                        <input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => actualizarCantidad(item.id_producto, e.target.value)}
                                            className="w-20 text-center bg-pr-dark border border-pr-gray rounded-md p-2"
                                            min="1"
                                        />
                                        <p className="font-bold w-24 text-right">${(parseFloat(item.precio_unitario_venta_producto) * item.cantidad).toFixed(2)}</p>
                                        <button onClick={() => eliminarDelCarrito(item.id_producto)} className="text-red-500 hover:text-red-400 font-bold p-2">
                                            X
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Columna Derecha: Total y Finalizar --- */}
                <div className="bg-pr-dark p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-pr-yellow">Resumen de Venta</h2>
                        {error && <div className="mb-4 text-red-400 bg-red-900 bg-opacity-50 p-3 rounded-lg">{error}</div>}
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-3xl font-bold">
                            <span className="text-pr-gray">Total:</span>
                            <span className="text-pr-yellow">${totalCarrito.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={finalizarVenta}
                            disabled={loading || carrito.length === 0}
                            className="w-full bg-pr-yellow text-pr-dark font-bold text-xl py-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-pr-gray disabled:text-pr-dark-gray disabled:scale-100"
                        >
                            {loading ? 'Procesando...' : 'Finalizar Venta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VentasPOS;
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import apiClient from '../../api/apiClient';

const POSPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (searchTerm.length > 2) {
            setLoading(true);
            apiClient(`/api/stock/productos/?search=${searchTerm}`)
                .then(data => {
                    setSearchResults(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const addToCart = (product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === product.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(currentCart => currentCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        const newQuantity = parseInt(quantity, 10);
        if (newQuantity > 0) {
            setCart(currentCart =>
                currentCart.map(item =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        } else {
            removeFromCart(productId);
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + item.precio_venta * item.quantity, 0);
    const iva = subtotal * 0.21; // Assuming 21% IVA
    const total = subtotal + iva;

    const handleCobrar = async () => {
        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        const ventaData = {
            // Assuming the API needs a list of detail items
            // This structure might need to be adjusted based on the actual API requirements
            detalle_venta: cart.map(item => ({
                producto: item.id,
                cantidad: item.quantity,
                precio_unitario: item.precio_venta,
            })),
            total: total.toFixed(2),
            // Add other required fields like 'cliente', 'metodo_pago', etc.
        };

        try {
            setLoading(true);
            const response = await apiClient('/api/ventas/ventas/', {
                method: 'POST',
                body: JSON.stringify(ventaData),
            });
            alert('Venta registrada con éxito!');
            setCart([]); // Clear cart after successful sale
        } catch (err) {
            setError(err.message);
            alert(`Error al registrar la venta: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="h-full">
            <h1 className="text-3xl font-bold text-white mb-6">Punto de Venta (POS)</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">

                {/* Columna Izquierda: Búsqueda y Productos */}
                <div className="lg:col-span-2 bg-pr-dark p-6 rounded-lg shadow-lg h-full overflow-y-auto">
                    <h2 className="text-xl font-bold text-white mb-4">Buscar Productos</h2>
                    <div className="relative mb-6">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o escanear código de barras..."
                            className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                    </div>

                    {/* Resultados de búsqueda o grid de productos */}
                    <div className="text-pr-gray">
                        {loading && <p>Buscando...</p>}
                        {error && <p className="text-red-500">Error: {error}</p>}
                        {searchResults.length > 0 ? (
                            searchResults.map(product => (
                                <div key={product.id} className="flex items-center justify-between bg-pr-dark-gray p-4 rounded-lg mt-4">
                                    <div>
                                        <p className="font-bold text-white">{product.nombre}</p>
                                        <p className="text-sm text-pr-gray">${product.precio_venta}</p>
                                    </div>
                                    <button onClick={() => addToCart(product)} className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors">
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        Añadir
                                    </button>
                                </div>
                            ))
                        ) : (
                            !loading && <p>Aquí se mostrarán los resultados de la búsqueda.</p>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Ticket de Venta */}
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg h-full flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-4">Ticket de Venta</h2>
                    
                    <div className="flex-grow overflow-y-auto">
                        {cart.length === 0 ? (
                            <p className="text-pr-gray text-center mt-8">Aún no hay productos en el ticket.</p>
                        ) : (
                            <ul className="space-y-3">
                                {cart.map(item => (
                                    <li key={item.id} className="flex items-center justify-between bg-pr-dark-gray p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                className="w-16 bg-pr-dark text-white border border-pr-gray/20 rounded-md p-1 text-center"
                                            />
                                            <div className="ml-3">
                                                <p className="font-bold text-white">{item.nombre}</p>
                                                <p className="text-sm text-pr-gray">${item.precio_venta}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="font-bold text-white mr-4">${(item.precio_venta * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400">
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-pr-gray/20 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-lg">
                            <span className="text-pr-gray">Subtotal:</span>
                            <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="text-pr-gray">IVA (21%):</span>
                            <span className="font-bold text-white">${iva.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-2xl mt-2">
                            <span className="font-bold text-pr-yellow">Total:</span>
                            <span className="font-bold text-pr-yellow">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCobrar}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-pr-yellow text-pr-dark font-bold text-xl py-3 rounded-lg mt-6 hover:bg-opacity-80 transition-colors disabled:bg-gray-500"
                    >
                        {loading ? 'Procesando...' : 'Cobrar'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default POSPage;

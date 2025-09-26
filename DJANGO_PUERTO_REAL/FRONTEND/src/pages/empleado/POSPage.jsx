import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

const POSPage = () => {
    // Mock data for now
    const [cart, setCart] = useState([]);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const iva = subtotal * 0.21; // Assuming 21% IVA
    const total = subtotal + iva;

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
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                    </div>

                    {/* Resultados de búsqueda o grid de productos */}
                    <div className="text-pr-gray">
                        <p>Aquí se mostrarán los resultados de la búsqueda o un grid de productos frecuentes.</p>
                        {/* Example Product Item */}
                        <div className="flex items-center justify-between bg-pr-dark-gray p-4 rounded-lg mt-4">
                            <div>
                                <p className="font-bold text-white">Producto de Ejemplo</p>
                                <p className="text-sm text-pr-gray">$10.00</p>
                            </div>
                            <button className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors">
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Añadir
                            </button>
                        </div>
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
                                {/* Cart items would be mapped here */}
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

                    <button className="w-full bg-pr-yellow text-pr-dark font-bold text-xl py-3 rounded-lg mt-6 hover:bg-opacity-80 transition-colors">
                        Cobrar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default POSPage;

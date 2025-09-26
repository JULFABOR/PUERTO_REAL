import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const ControlStockPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                setError('No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/stock/productos/', {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // Si el token es inválido o ha expirado, el servidor devolverá 401
                    if (response.status === 401) {
                        throw new Error('Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
                    }
                    throw new Error('Error al obtener los productos del servidor.');
                }

                const data = await response.json();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); // El array vacío significa que este efecto se ejecuta una vez al montar el componente

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Control de Stock</h1>

            {/* Search and Filter Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o código..."
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                {loading && <p className="text-center text-pr-gray">Cargando productos...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}
                {!loading && !error && (
                    <table className="w-full text-left text-pr-gray">
                        <thead className="border-b border-pr-gray/20">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4">Código</th>
                                <th className="p-4">Stock Actual</th>
                                <th className="p-4">Precio</th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                    <td className="p-4 font-bold text-white">{product.name}</td>
                                    <td className="p-4">{product.sku}</td>
                                    <td className={`p-4 font-bold ${product.stock > 20 ? 'text-green-500' : product.stock > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {product.stock}
                                    </td>
                                    <td className="p-4">${product.price.toFixed(2)}</td>
                                    <td className="p-4">
                                        <button className="text-pr-yellow hover:underline">Ajustar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ControlStockPage;

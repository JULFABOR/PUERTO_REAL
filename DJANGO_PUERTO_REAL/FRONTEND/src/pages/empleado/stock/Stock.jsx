import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await apiClient('/api/stock/productos/');
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleAddProduct = () => {
        // Placeholder for add product functionality
        alert("Funcionalidad para añadir producto no implementada.");
    };
    
    const handleAdjustStock = (productId) => {
        // Placeholder for adjust stock functionality
        alert(`Funcionalidad para ajustar stock del producto ${productId} no implementada.`);
    };

    if (loading) {
        return <p className="text-center text-pr-gray">Cargando productos...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Stock</h1>

            {/* Search and Add Product Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                </div>
                <button 
                    onClick={handleAddProduct}
                    className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Producto
                </button>
            </div>

            {/* Products Table */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left text-pr-gray">
                    <thead className="border-b border-pr-gray/20">
                        <tr>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Stock Actual</th>
                            <th className="p-4">Precio de Venta</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                    <td className="p-4 font-bold text-white">{product.nombre}</td>
                                    <td className="p-4">{product.categoria_nombre || 'N/A'}</td>
                                    <td className={`p-4 font-bold ${product.stock_actual > product.low_stock_threshold ? 'text-green-500' : product.stock_actual > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {product.stock_actual}
                                    </td>
                                    <td className="p-4">${parseFloat(product.precio_venta).toFixed(2)}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleAdjustStock(product.id)}
                                            className="text-pr-yellow hover:underline"
                                        >
                                            Ajustar Stock
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-8">No se encontraron productos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Stock;

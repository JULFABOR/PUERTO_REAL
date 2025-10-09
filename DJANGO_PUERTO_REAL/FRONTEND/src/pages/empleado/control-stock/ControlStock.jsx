import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const ControlStock = () => {
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
        if (!products) return [];
        return products.filter(product =>
            (product.nombre_producto && product.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm]);

    const handleAddProduct = () => {
        // Lógica para abrir el modal de añadir producto
        alert("Funcionalidad para añadir producto no implementada.");
    };

    const handleEditProduct = (productId) => {
        // Lógica para abrir el modal de edición con los datos del producto
        alert(`Funcionalidad para editar producto ${productId} no implementada.`);
    };

    const handleDeleteProduct = (productId) => {
        // Lógica para confirmar y eliminar el producto
        alert(`Funcionalidad para eliminar producto ${productId} no implementada.`);
    };

    if (loading) {
        return <p className="text-center text-pr-gray">Cargando productos...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error al cargar el stock: {error}</p>;
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-white mb-6">Control de Stock</h1>

            {/* Barra de Búsqueda y Botón de Añadir */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o código de barras..."
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

            {/* Tabla de Productos */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left text-pr-gray">
                    <thead className="border-b border-pr-gray/20">
                        <tr>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Código de Barras</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4 text-center">Stock Actual</th>
                            <th className="p-4 text-right">Precio de Venta</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <tr key={product.id_producto} className={`border-b border-pr-gray/20 hover:bg-pr-dark-gray ${product.cantidad_total <= (product.low_stock_threshold || 10) ? 'bg-red-900/20' : ''}`}>
                                    <td className="p-4 font-bold text-white">{product.nombre_producto}</td>
                                    <td className="p-4 font-mono">{product.barcode || 'N/A'}</td>
                                    <td className="p-4">{product.categoria_nombre || 'N/A'}</td>
                                    <td className={`p-4 font-bold text-center ${product.cantidad_total > (product.low_stock_threshold || 10) ? 'text-green-500' : product.cantidad_total > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {product.cantidad_total}
                                    </td>
                                    <td className="p-4 text-right">${parseFloat(product.precio_venta).toFixed(2)}</td>
                                    <td className="p-4 flex justify-center items-center space-x-4">
                                        <button onClick={() => handleEditProduct(product.id_producto)} className="text-blue-500 hover:text-blue-400" title="Editar">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button onClick={() => handleDeleteProduct(product.id_producto)} className="text-red-600 hover:text-red-500" title="Eliminar">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-8">No se encontraron productos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ControlStock;
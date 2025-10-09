import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import apiClient from '@/api/apiClient';

const JefeControlStock = () => {
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showNewProductModal, setShowNewProductModal] = useState(false);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const initialNewProductState = {
        nombre_producto: '',
        barcode: '',
        categoria_producto: '',
        precio_unitario_venta_producto: '',
        low_stock_threshold: 10,
    };

    const [newProduct, setNewProduct] = useState(initialNewProductState);

    const [addStockState, setAddStockState] = useState({
        searchTerm: '',
        selectedProduct: null,
        quantity: '',
        notes: '',
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData] = await Promise.all([
                apiClient('/stock/productos/'),
                apiClient('/stock/categorias/')
            ]);
            setProducts(productsData || []);
            setCategories(categoriesData || []);
        } catch (error) {
            console.error("Fetch data error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.nombre_producto || !newProduct.barcode || !newProduct.categoria_producto || !newProduct.precio_unitario_venta_producto) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        try {
            const payload = {
                ...newProduct,
                categoria_producto: parseInt(newProduct.categoria_producto, 10),
                precio_unitario_venta_producto: parseFloat(newProduct.precio_unitario_venta_producto),
                low_stock_threshold: parseInt(newProduct.low_stock_threshold, 10),
            };

            await apiClient('/stock/productos/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setShowNewProductModal(false);
            setNewProduct(initialNewProductState);
            fetchAllData();
        } catch (error) {
            console.error("Failed to create product:", error);
            alert(`Error al crear el producto: ${error.message}`);
        }
    };

    const handleAddStockChange = (e) => {
        const { name, value } = e.target;
        setAddStockState(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectProductForStock = (product) => {
        setAddStockState(prev => ({ ...prev, selectedProduct: product, searchTerm: product.nombre_producto }));
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        if (!addStockState.selectedProduct || !addStockState.quantity) {
            alert('Por favor, seleccione un producto y especifique una cantidad.');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.employee_id) {
            alert('No se pudo encontrar la información del empleado. Por favor, inicie sesión de nuevo.');
            return;
        }

        try {
            const payload = {
                product_id: addStockState.selectedProduct.id_producto,
                quantity: parseInt(addStockState.quantity, 10),
                movement_type: 'MOV_STOCK_AJUSTE',
                reason: addStockState.notes || 'Ajuste de stock manual',
                employee: userData.employee_id,
            };

            await apiClient('/stock/adjust/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setShowAddStockModal(false);
            setAddStockState({ searchTerm: '', selectedProduct: null, quantity: '', notes: '' });
            fetchAllData();
        } catch (error) {
            console.error("Failed to add stock:", error);
            alert(`Error al agregar stock: ${error.message}`);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!addStockState.searchTerm) return [];
        return products.filter(p => 
            (p.nombre_producto && p.nombre_producto.toLowerCase().includes(addStockState.searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(addStockState.searchTerm.toLowerCase()))
        );
    }, [addStockState.searchTerm, products]);

    const stats = useMemo(() => {
        const inventoryValue = products.reduce((acc, product) => acc + (product.precio_unitario_venta_producto * product.total_stock), 0);
        const uniqueProducts = products.length;
        const lowStockAlerts = products.filter(p => p.is_low_stock && p.total_stock > 0).length;
        const outOfStockProducts = products.filter(p => p.total_stock === 0).length;
        return { inventoryValue, uniqueProducts, lowStockAlerts, outOfStockProducts };
    }, [products]);

    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR')}`;

    const getStatus = (product) => {
        if (product.total_stock === 0) {
            return { text: 'Sin Stock', className: 'bg-yellow-900 text-yellow-300' };
        }
        if (product.is_low_stock) {
            return { text: 'Stock Bajo', className: 'bg-red-900 text-red-300' };
        }
        return { text: 'En Stock', className: 'bg-green-900 text-green-300' };
    };

    if (loading && !products.length) {
        return <div className="text-center text-white">Cargando inventario...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">Error al cargar el inventario: {error}</div>;
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Inventario</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowAddStockModal(true)} className="w-full sm:w-auto text-white bg-pr-gray hover:bg-gray-600 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faPlusCircle} />
                        <span>Agregar Stock</span>
                    </button>
                    <button onClick={() => setShowNewProductModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Nuevo Producto</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Valor del Inventario</p><p className="text-3xl font-bold text-white">{formatCurrency(stats.inventoryValue)}</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos Únicos</p><p className="text-3xl font-bold text-white">{stats.uniqueProducts}</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Alertas Stock Bajo</p><p className="text-3xl font-bold text-red-500">{stats.lowStockAlerts}</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos sin Stock</p><p className="text-3xl font-bold text-white">{stats.outOfStockProducts}</p></div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" id="table-search" className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por producto o SKU..." />
                <select id="category-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Filtrar por Categoría</option>
                    {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
                <select id="status-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Filtrar por Estado</option>
                    <option value="stock">En Stock</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                </select>
            </div>

            {/* Products Table */}
            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Proveedor</th>
                            <th scope="col" className="px-6 py-3">Stock</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Precio Venta</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Valor Stock</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => {
                            const status = getStatus(product);
                            return (
                                <tr key={product.id_producto} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                    <td className="px-6 py-4 font-mono text-xs">{product.barcode}</td>
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{product.nombre_producto}</th>
                                    <td className="px-6 py-4 hidden sm:table-cell">{product.supplier || 'N/A'}</td>
                                    <td className={`px-6 py-4 font-bold ${status.text === 'Stock Bajo' ? 'text-red-500' : ''}`}>{product.total_stock}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{formatCurrency(product.precio_unitario_venta_producto)}</td>
                                    <td className="px-6 py-4 hidden lg:table-cell font-medium text-white">{formatCurrency(product.precio_unitario_venta_producto * product.total_stock)}</td>
                                    <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${status.className}`}>{status.text}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Stock Modal */}
            {showAddStockModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Agregar Stock a Inventario</h3>
                                <button type="button" onClick={() => setShowAddStockModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleAddStock}>
                                    <div className="relative">
                                        <label htmlFor="searchTerm" className="block mb-2 text-sm font-medium text-white">Buscar Producto</label>
                                        <input 
                                            type="text" 
                                            name="searchTerm" 
                                            id="searchTerm" 
                                            value={addStockState.searchTerm}
                                            onChange={handleAddStockChange}
                                            className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" 
                                            placeholder="Buscar por SKU o nombre..." 
                                            required 
                                        />
                                        {addStockState.searchTerm && filteredProducts.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-pr-dark-gray border border-gray-600 rounded-lg shadow-lg">
                                                <ul>
                                                    {filteredProducts.slice(0, 5).map(p => (
                                                        <li 
                                                            key={p.id_producto} 
                                                            className="p-2 text-white hover:bg-pr-gray cursor-pointer"
                                                            onClick={() => handleSelectProductForStock(p)}
                                                        >
                                                            {p.nombre_producto}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-white">Cantidad a Agregar</label>
                                        <input type="number" name="quantity" id="quantity" value={addStockState.quantity} onChange={handleAddStockChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="0" required />
                                    </div>
                                    <div>
                                        <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white">Notas (Opcional)</label>
                                        <textarea id="notes" name="notes" rows="3" value={addStockState.notes} onChange={handleAddStockChange} className="block p-2.5 w-full text-sm rounded-lg border bg-pr-dark-gray border-gray-600 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Ej: Factura Nº 1234 de Proveedor X"></textarea>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Confirmar Ingreso</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Product Modal */}
            {showNewProductModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Crear Nuevo Producto</h3>
                                <button type="button" onClick={() => setShowNewProductModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleCreateProduct}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nombre_producto" className="block mb-2 text-sm font-medium text-white">Nombre del Producto</label>
                                            <input type="text" name="nombre_producto" id="nombre_producto" value={newProduct.nombre_producto} onChange={handleNewProductChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="barcode" className="block mb-2 text-sm font-medium text-white">SKU / Código</label>
                                            <input type="text" name="barcode" id="barcode" value={newProduct.barcode} onChange={handleNewProductChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="categoria_producto" className="block mb-2 text-sm font-medium text-white">Categoría</label>
                                            <select id="categoria_producto" name="categoria_producto" value={newProduct.categoria_producto} onChange={handleNewProductChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required>
                                                <option value="">Seleccione una categoría</option>
                                                {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="precio_unitario_venta_producto" className="block mb-2 text-sm font-medium text-white">Precio Venta</label>
                                            <input type="number" step="0.01" name="precio_unitario_venta_producto" id="precio_unitario_venta_producto" value={newProduct.precio_unitario_venta_producto} onChange={handleNewProductChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="low_stock_threshold" className="block mb-2 text-sm font-medium text-white">Alerta Stock Bajo</label>
                                            <input type="number" name="low_stock_threshold" id="low_stock_threshold" value={newProduct.low_stock_threshold} onChange={handleNewProductChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="10" required />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Crear Producto</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeControlStock;
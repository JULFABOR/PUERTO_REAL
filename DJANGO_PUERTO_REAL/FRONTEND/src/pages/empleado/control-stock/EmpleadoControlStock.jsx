import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const EmpleadoControlStock = () => {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userData, setUserData] = useState(null);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const initialAddStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: 'Recepción de pedido' };
    const [addStockState, setAddStockState] = useState(initialAddStockState);
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableSelectedCategory, setTableSelectedCategory] = useState('');
    const [tableSelectedStatus, setTableSelectedStatus] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData] = await Promise.all([
                apiClient('/api/stock/productos/'),
                apiClient('/api/stock/categorias/')
            ]);
            const productList = productsData.results || productsData || [];
            setProducts(productList);
            setAllProducts(productList);
            setCategories(categoriesData || []);
        } catch (error) {
            toast.error("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, [fetchData]);

    const handleAddStockChange = (e) => {
        const { name, value } = e.target;
        setAddStockState(prev => ({ ...prev, [name]: value, ...(name === 'searchTerm' && { selectedProduct: null }) }));
    };

    const handleSelectProductForStock = (product) => {
        setAddStockState(prev => ({ ...prev, selectedProduct: product, searchTerm: `${product.nombre_producto} (SKU: ${product.barcode})` }));
    };
    
    const handleAddStockSubmit = async (e) => {
        e.preventDefault();
        if (!addStockState.selectedProduct || !addStockState.quantity) {
            return toast.error("Debes seleccionar un producto y especificar una cantidad.");
        }
        if (!userData || !userData.empleado_id) {
            return toast.error("No se pudo identificar al empleado. Por favor, inicia sesión de nuevo.");
        }
        setIsSubmitting(true);
        const payload = {
            product_id: addStockState.selectedProduct.id_producto,
            quantity: parseInt(addStockState.quantity, 10),
            reason: addStockState.reason,
            employee: userData.empleado_id,
        };
        try {
            await apiClient('/api/stock/add-stock/', { method: 'POST', body: JSON.stringify(payload) });
            toast.success('¡Stock agregado correctamente!');
            setShowAddStockModal(false);
            setAddStockState(initialAddStockState);
            await fetchData();
        } catch (error) {
            toast.error(error.data?.detail || 'No se pudo agregar el stock.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getStatus = (product) => {
        const stock = product.total_stock || 0;
        if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-900 text-red-300', value: 'out' };
        if (stock > 0 && stock <= product.low_stock_threshold) return { text: 'Stock Bajo', className: 'bg-yellow-900 text-yellow-300', value: 'low' };
        return { text: 'En Stock', className: 'bg-green-900 text-green-300', value: 'stock' };
    };

    const tableFilteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchLower = tableSearchTerm.toLowerCase();
            const searchMatch = !tableSearchTerm || p.nombre_producto.toLowerCase().includes(searchLower) || (p.barcode && p.barcode.toLowerCase().includes(searchLower));
            const categoryMatch = !tableSelectedCategory || p.categoria_producto?.id_categoria === parseInt(tableSelectedCategory);
            const statusMatch = !tableSelectedStatus || getStatus(p).value === tableSelectedStatus;
            return searchMatch && categoryMatch && statusMatch;
        });
    }, [products, tableSearchTerm, tableSelectedCategory, tableSelectedStatus]);
    
    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR')}`;

    if (loading) {
        return <div className="text-center text-white py-10">Cargando inventario...</div>;
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Control de Inventario</h1>
                <button onClick={() => setShowAddStockModal(true)} className="w-full sm:w-auto text-white bg-green-600 hover:bg-green-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faPlusCircle} />
                    <span>Agregar Stock</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" placeholder="Buscar en la tabla..." value={tableSearchTerm} onChange={e => setTableSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" />
                <select value={tableSelectedCategory} onChange={e => setTableSelectedCategory(e.target.value)} className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Filtrar por Categoría</option>
                    {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
                <select value={tableSelectedStatus} onChange={e => setTableSelectedStatus(e.target.value)} className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Filtrar por Estado</option>
                    <option value="stock">En Stock</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                </select>
            </div>

            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3">Stock Total</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableFilteredProducts.map((product) => {
                            const status = getStatus(product);
                            return (
                                <tr key={product.id_producto} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                    <td className="px-6 py-4 font-mono text-xs">{product.barcode}</td>
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{product.nombre_producto}</th>
                                    <td className={`px-6 py-4 font-bold ${status.value === 'low' ? 'text-yellow-400' : status.value === 'out' ? 'text-red-500' : 'text-white'}`}>{product.total_stock || 0}</td>
                                    <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${status.className}`}>{status.text}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* --- CORRECCIÓN: Toda la estructura del modal está ahora dentro de la condición --- */}
            {showAddStockModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Agregar Stock a Inventario</h3>
                                <button type="button" onClick={() => setShowAddStockModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleAddStockSubmit}>
                                    <div className="relative">
                                        <label htmlFor="searchTerm" className="block mb-2 text-sm font-medium text-white">Buscar Producto</label>
                                        <input type="text" name="searchTerm" id="searchTerm" value={addStockState.searchTerm} onChange={handleAddStockChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" placeholder="Buscar por SKU o nombre..." autoComplete="off" required />
                                        {addStockState.searchTerm && !addStockState.selectedProduct && (
                                            <div className="absolute z-10 w-full mt-1 bg-pr-dark-gray border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                <ul>
                                                    {allProducts.filter(p => p.nombre_producto.toLowerCase().includes(addStockState.searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(addStockState.searchTerm))).slice(0, 5).map(p => (
                                                        <li key={p.id_producto} className="p-2 text-white hover:bg-gray-700 cursor-pointer" onClick={() => handleSelectProductForStock(p)}>
                                                            {p.nombre_producto}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-white">Cantidad a Agregar</label>
                                        <input type="number" name="quantity" id="quantity" value={addStockState.quantity} onChange={handleAddStockChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" placeholder="0" required min="1" />
                                    </div>
                                    <div>
                                        <label htmlFor="reason" className="block mb-2 text-sm font-medium text-white">Motivo</label>
                                        <input type="text" name="reason" id="reason" value={addStockState.reason} onChange={handleAddStockChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-800 disabled:cursor-not-allowed">
                                        {isSubmitting ? 'Agregando...' : 'Agregar Stock'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EmpleadoControlStock;
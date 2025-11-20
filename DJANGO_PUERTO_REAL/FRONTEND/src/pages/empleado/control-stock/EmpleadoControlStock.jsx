import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle, faPlus, faSpinner, faExclamationTriangle, faInbox,
    faSort, faSortUp, faSortDown, faCircle, faEye
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios

import AddStockModal from '@/components/modals/ControlStock/AddStockModal';
import StockHistoryModal from '@/components/Modals/ControlStock/StockHistoryModal'; 

// --- Componentes Helper ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className} whitespace-nowrap`}>
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-1.5" />
        {status.text}
    </span>
);
// --- Fin Componentes Helper ---

const EmpleadoControlStock = () => {
    // --- Estados ---
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    const initialAddStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: 'Recepción de pedido' };
    const [addStockState, setAddStockState] = useState(initialAddStockState);
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableSelectedCategory, setTableSelectedCategory] = useState('');
    const [tableSelectedStatus, setTableSelectedStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_producto', direction: 'ascending' });

    
    // --- FUNCIÓN DE FETCH REFACTORIZADA ---
    const fetchData = useCallback(async () => {
        if (!loading) setLoading(true); 
        setError(null);
        try {
            // 1. Usamos apiClient.get() y quitamos /api/ de las rutas
            const [productsResponse, categoriesResponse] = await Promise.all([
                apiClient.get('/stock/productos/'),
                apiClient.get('/stock/categorias/')
            ]);

            // 2. Los datos ahora están en la propiedad .data
            const productsData = productsResponse.data;
            const categoriesData = categoriesResponse.data;

            const productList = productsData.results || productsData || [];
            setProducts(productList);
            setAllProducts(productList); 
            setCategories(categoriesData.results || categoriesData || []);
        
        } catch (error) {
            // 3. Mejoramos el manejo de errores de Axios
            const errorMsg = error.response?.data?.detail || error.message || 'Error desconocido';
            toast.error(`Error al cargar los datos: ${errorMsg}`);
            setError(errorMsg);
        
        } finally {
            setLoading(false);
        }
    }, []); // 'loading' no debe estar aquí

    useEffect(() => {
        fetchData();
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, [fetchData]);

    // --- Resto de Handlers y Lógica (Sin cambios) ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSuccess = () => {
        setShowAddStockModal(false);
        setShowHistoryModal(false);
        fetchData(); // Refresca los datos
    };
    
    const openAddStockModal = (product) => {
        if (product) {
            setAddStockState({
                ...initialAddStockState,
                selectedProduct: product,
                searchTerm: `${product.nombre_producto} (SKU: ${product.barcode || 'N/A'})`,
            });
        } else {
            setAddStockState(initialAddStockState);
        }
        setShowAddStockModal(true);
    };

    const openHistoryModal = (product) => {
        setSelectedProductForHistory(product);
        setShowHistoryModal(true);
    };
    
    const getStatus = (product) => {
        const stock = product.total_stock || 0;
        const lowStockThreshold = product.low_stock_threshold || 10;
        if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-600/20 text-red-300', value: 'out' };
        if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-600/20 text-yellow-300', value: 'low' };
        return { text: 'En Stock', className: 'bg-green-600/20 text-green-300', value: 'stock' };
    };

    const tableFilteredProducts = useMemo(() => {
        let filtered = products.filter(p => {
            const searchLower = tableSearchTerm.toLowerCase();
            const searchMatch = !tableSearchTerm || p.nombre_producto.toLowerCase().includes(searchLower) || (p.barcode && p.barcode.toLowerCase().includes(searchLower));
            const categoryMatch = !tableSelectedCategory || p.categoria_producto?.id_categoria === parseInt(tableSelectedCategory);
            const statusMatch = !tableSelectedStatus || getStatus(p).value === tableSelectedStatus;
            return searchMatch && categoryMatch && statusMatch;
        });

        if (sortConfig.key) {
           filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                if (sortConfig.key === 'categoria_producto') {
                    aValue = a.categoria_producto?.nombre_categoria || '';
                    bValue = b.categoria_producto?.nombre_categoria || '';
                }
                if (['precio_unitario_venta_producto', 'total_stock'].includes(sortConfig.key)) {
                    aValue = aValue || 0;
                    bValue = bValue || 0;
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }
                if (sortConfig.key === 'estado') {
                    aValue = getStatus(a).text;
                    bValue = getStatus(b).text;
                }

                const comparison = (aValue || '').toString().localeCompare((bValue || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }

        return filtered;
    }, [products, tableSearchTerm, tableSelectedCategory, tableSelectedStatus, sortConfig]);
    
    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- Render Lógica ---
    if (loading && products.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 text-pr-yellow">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                <div>
                    <strong className="font-bold">Error al cargar el inventario:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            </div>
        );
    }

    // --- Render JSX ---
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Control de Inventario</h1>
                <button 
                    onClick={() => openAddStockModal(null)} 
                    className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlusCircle} />
                    <span>Agregar Stock</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" placeholder="Buscar por Nombre o SKU..." value={tableSearchTerm} onChange={e => setTableSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" />
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

            <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('barcode')}>
                                <div className="flex items-center">
                                    SKU <SortIndicator direction={sortConfig.key === 'barcode' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('nombre_producto')}>
                                <div className="flex items-center">
                                    Producto <SortIndicator direction={sortConfig.key === 'nombre_producto' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('categoria_producto')}>
                                <div className="flex items-center">
                                    Categoría <SortIndicator direction={sortConfig.key === 'categoria_producto' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('precio_unitario_venta_producto')}>
                                <div className="flex items-center">
                                    Precio Venta <SortIndicator direction={sortConfig.key === 'precio_unitario_venta_producto' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('total_stock')}>
                                <div className="flex items-center">
                                    Stock Total <SortIndicator direction={sortConfig.key === 'total_stock' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('estado')}>
                                <div className="flex items-center">
                                    Estado <SortIndicator direction={sortConfig.key === 'estado' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>

                    <tbody>
                        {tableFilteredProducts.length > 0 ? (
                            tableFilteredProducts.map((product) => {
                                const status = getStatus(product);
                                return (
                                    <tr key={product.id_producto} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800">
                                        <td className="px-6 py-4 font-mono text-xs">{product.barcode || 'N/A'}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{product.nombre_producto}</th>
                                        <td className="px-6 py-4 text-gray-300">{product.categoria_producto?.nombre_categoria || 'Sin Cat.'}</td>
                                        <td className="px-6 py-4 font-medium text-white">{formatCurrency(product.precio_unitario_venta_producto)}</td>
                                        <td className={`px-6 py-4 font-bold ${status.value === 'low' ? 'text-yellow-400' : status.value === 'out' ? 'text-red-500' : 'text-white'}`}>{product.total_stock || 0}</td>
                                        <td className="px-6 py-4"><StatusBadge status={status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => openHistoryModal(product)}
                                                    className="p-2 w-9 h-9 flex items-center justify-center bg-pr-gray/10 text-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-pr-dark transition-colors"
                                                    title="Ver historial de stock"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    onClick={() => openAddStockModal(product)}
                                                    className="p-2 w-9 h-9 flex items-center justify-center bg-pr-gray/10 text-pr-yellow rounded-lg hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                                    title="Agregar stock a este producto"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center p-12 text-pr-gray">
                                    <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                                    <p className="font-bold text-white text-lg">
                                        {tableSearchTerm || tableSelectedCategory || tableSelectedStatus 
                                            ? 'No se encontraron productos con esos filtros.' 
                                            : 'No hay productos en el inventario.'}
                                    </p>
                                    <p className="text-sm">Intenta ajustar tu búsqueda.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <AddStockModal
                isOpen={showAddStockModal}
                onClose={() => setShowAddStockModal(false)}
                onSuccess={handleSuccess}
                allProducts={allProducts}
                userData={userData}
                initialState={addStockState}
                setInitialState={setAddStockState}
            />
            
            <StockHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                product={selectedProductForHistory}
            /> 
            
        </>
    );
};

export default EmpleadoControlStock;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle,
    faExchangeAlt,
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faInbox,
    faSort,
    faSortUp,
    faSortDown,
    faCircle,
    faEye
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import useDebounce from '../../hooks/useDebounce'; 

// --- Modals ---
import AddStockModal from '@/components/modals/ControlStock/AddStockModal'; 
import AdjustStockModal from '@/components/modals/ControlStock/AdjustStockModal';
import StockHistoryModal from '@/components/Modals/ControlStock/StockHistoryModal';

// --- HELPER COMPONENT SORT INDICATOR (Sin cambios) ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- HELPER COMPONENT STATUS BADGE (Sin cambios) ---
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className} whitespace-nowrap`}>
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-1.5" />
        {status.text}
    </span>
);

// --- FUNCIÓN getStatus (Sin cambios) ---
const getStatus = (product) => {
    const stock = product.total_stock || 0;
    const lowStockThreshold = product.low_stock_threshold || 10;
    if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-600/20 text-red-300', value: 'out' };
    if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-600/20 text-yellow-300', value: 'low' };
    return { text: 'En Stock', className: 'bg-green-600/20 text-green-300', value: 'stock' };
};

const JefeControlStock = () => {
    // --- ESTADOS (Sin cambios) ---
    const [products, setProducts] = useState([]); 
    const [allProducts, setAllProducts] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableSelectedCategory, setTableSelectedCategory] = useState('');
    const [tableSelectedStatus, setTableSelectedStatus] = useState(''); 
    const debouncedSearchTerm = useDebounce(tableSearchTerm, 500); 
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_producto', direction: 'ascending' });
    const initialAddStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: 'Compra a proveedor' };
    const [addStockState, setAddStockState] = useState(initialAddStockState);

    // --- LÓGICA DE DATOS (REFACTORIZADA) ---
    
    // --- CAMBIOS EN fetchData ---
    const fetchData = useCallback(async () => {
        setError(null);
        try {
            // --- CAMBIO 1: Parámetros de Axios ---
            const productParams = {};
            if (debouncedSearchTerm) productParams.search = debouncedSearchTerm;
            if (tableSelectedCategory) productParams.categoria_producto = tableSelectedCategory;

            // --- CAMBIO 2: Sintaxis de Axios GET ---
            const [productsResponse, categoriesResponse] = await Promise.all([
                apiClient.get('/stock/productos/', { params: productParams }),
                apiClient.get('/stock/categorias/')
            ]);

            // --- CAMBIO 3: Acceso a datos con .data ---
            const productsData = productsResponse.data;
            const categoriesData = categoriesResponse.data;

            let productList = [];
            if (productsData && Array.isArray(productsData.results)) {
                 productList = productsData.results;
            } else if (productsData && Array.isArray(productsData)) {
                 productList = productsData;
            }
            setProducts(productList); 
            setAllProducts(productList); // Para las stats

            setCategories(categoriesData.results || categoriesData || []);

        } catch (err) {
            // --- CAMBIO 4: Manejo de error de Axios ---
            console.error("Fetch Error:", err); 
            const errorMsg = err.response?.data?.detail || err.message || "Error al cargar los datos.";
            toast.error(errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, tableSelectedCategory]); 

    // --- Resto de hooks y funciones (Sin cambios) ---
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, []);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSuccess = () => {
        setShowAddStockModal(false);
        setShowAdjustStockModal(false);
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

    const stats = useMemo(() => {
        const productList = allProducts; 
        const inventoryValue = productList.reduce((acc, p) => acc + ((p.precio_unitario_venta_producto || 0) * (p.total_stock || 0)), 0);
        const uniqueProducts = productList.length;
        const lowStockAlerts = productList.filter(p => getStatus(p).value === 'low').length;
        const outOfStockProducts = productList.filter(p => getStatus(p).value === 'out').length;
        return { inventoryValue, uniqueProducts, lowStockAlerts, outOfStockProducts };
    }, [allProducts]);

    const tableFilteredProducts = useMemo(() => {
        let filtered = products.filter(p => {
            const statusMatch = !tableSelectedStatus || getStatus(p).value === tableSelectedStatus;
            return statusMatch;
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
    }, [products, tableSelectedStatus, sortConfig]); 

    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- RENDERIZADO (Sin cambios) ---
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

    return (
        <>
            {/* --- CABECERA --- */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Inventario</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => openAddStockModal(null)}
                        className="btn-primary w-full sm:w-auto"
                    >
                        <FontAwesomeIcon icon={faPlusCircle} />
                        <span>Agregar Stock</span>
                    </button>
                    <button
                        onClick={() => setShowAdjustStockModal(true)}
                        className="btn-primary w-full sm:w-auto"
                    >
                        <FontAwesomeIcon icon={faExchangeAlt} />
                        <span>Ajustar Stock</span>
                    </button>
                </div>
             </div>

            {/* --- TARJETAS DE ESTADÍSTICAS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Valor Total Inventario</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(stats.inventoryValue)}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Productos Únicos</p>
                    <p className="text-3xl font-bold text-white">{stats.uniqueProducts}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Alertas Stock Bajo</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.lowStockAlerts}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Productos sin Stock</p>
                    <p className="text-3xl font-bold text-red-500">{stats.outOfStockProducts}</p>
                </div>
            </div>

            {/* --- Filtros --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por Nombre o SKU..."
                    value={tableSearchTerm}
                    onChange={e => setTableSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow"
                />
                <select
                    value={tableSelectedCategory}
                    onChange={e => setTableSelectedCategory(e.target.value)}
                    className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow"
                >
                    <option value="">Filtrar por Categoría</option>
                    {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
                <select
                    value={tableSelectedStatus}
                    onChange={e => setTableSelectedStatus(e.target.value)}
                    className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow"
                >
                    <option value="">Filtrar por Estado</option>
                    <option value="stock">En Stock</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                </select>
            </div>

            {/* --- Tabla de Productos --- */}
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
                                    <tr key={product.id_producto} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800 transition-colors">
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
                                     <p className="font-bold text-white text-lg">No se encontraron productos</p>
                                     <p className="text-sm">Intenta con otros filtros.</p>
                                 </td>
                             </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Modales --- */}
            <AddStockModal
                isOpen={showAddStockModal}
                onClose={() => setShowAddStockModal(false)}
                onSuccess={handleSuccess}
                allProducts={allProducts}
                userData={userData}
                initialState={addStockState}
                setInitialState={setAddStockState}
            />

            <AdjustStockModal
                isOpen={showAdjustStockModal}
                onClose={() => setShowAdjustStockModal(false)}
                onSuccess={handleSuccess}
                allProducts={allProducts}
                userData={userData}
            />

            <StockHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                product={selectedProductForHistory}
            /> 
            
        </>
    );
};

export default JefeControlStock;
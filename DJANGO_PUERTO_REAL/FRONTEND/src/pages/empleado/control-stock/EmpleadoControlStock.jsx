import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle,
    faPlus,
    faSpinner,                // --- AÑADIDO ---
    faExclamationTriangle,    // --- AÑADIDO ---
    faInbox,                  // --- AÑADIDO ---
    faSort,                   // --- AÑADIDO ---
    faSortUp,                 // --- AÑADIDO ---
    faSortDown,               // --- AÑADIDO ---
    faCircle,                 // --- AÑADIDO ---
    faEye                     // --- AÑADIDO ---
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

// --- MODIFICADO: Importa el modal externo ---
import AddStockModal from '@/components/modals/AddStockModal'; // Asegúrate que la ruta sea correcta
import StockHistoryModal from '@/components/Modals/StockHistoryModal'; 
// --- AÑADIDO: HELPER COMPONENT SORT INDICATOR ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- AÑADIDO: HELPER COMPONENT STATUS BADGE ---
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className} whitespace-nowrap`}>
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-1.5" />
        {status.text}
    </span>
);

const EmpleadoControlStock = () => {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Usado para el autocompletar del modal
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // --- AÑADIDO: Estado de Error ---
    const [userData, setUserData] = useState(null);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    
    // --- AÑADIDO: Estados para Modal de Historial ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    
    // Estado para el formulario del modal
    const initialAddStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: 'Recepción de pedido' };
    const [addStockState, setAddStockState] = useState(initialAddStockState);
    
    // Filtros de la tabla
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableSelectedCategory, setTableSelectedCategory] = useState('');
    const [tableSelectedStatus, setTableSelectedStatus] = useState('');

    // --- AÑADIDO: Estado de Ordenamiento ---
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_producto', direction: 'ascending' });

    // --- MODIFICADO: fetchData para manejar Error ---
    const fetchData = useCallback(async () => {
        // No mostramos el spinner en cada recarga, solo en la inicial
        if (!loading) setLoading(true); 
        setError(null);
        try {
            const [productsData, categoriesData] = await Promise.all([
                apiClient('/api/stock/productos/'),
                apiClient('/api/stock/categorias/')
            ]);
            const productList = productsData.results || productsData || [];
            setProducts(productList);
            setAllProducts(productList); // Asumiendo que /api/stock/productos/ devuelve todo
            setCategories(categoriesData.results || categoriesData || []);
        } catch (error) {
            toast.error("Error al cargar los datos.");
            setError(error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []); // Quitamos 'loading' de las dependencias

    useEffect(() => {
        fetchData();
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, [fetchData]);

    // --- AÑADIDO: Función de Ordenamiento ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- MODIFICADO: Esta es la función que llama el modal al tener éxito ---
    const handleSuccess = () => {
        setShowAddStockModal(false);
        setShowHistoryModal(false);
        fetchData(); // Refresca los datos
    };
    
    // Nueva función para abrir el modal, opcionalmente con un producto
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

    // --- AÑADIDO: Handler para modal de historial ---
    const openHistoryModal = (product) => {
        setSelectedProductForHistory(product);
        setShowHistoryModal(true);
    };
    
    // --- ELIMINADOS ---
    // handleAddStockChange, handleSelectProductForStock, y handleAddStockSubmit
    // ahora viven dentro del componente AddStockModal
    
    // --- MODIFICADO: Colores de 'getStatus' para consistencia ---
    const getStatus = (product) => {
        const stock = product.total_stock || 0;
        const lowStockThreshold = product.low_stock_threshold || 10; // Valor por defecto
        if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-600/20 text-red-300', value: 'out' };
        if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-600/20 text-yellow-300', value: 'low' };
        return { text: 'En Stock', className: 'bg-green-600/20 text-green-300', value: 'stock' };
    };

    // --- MODIFICADO: 'useMemo' ahora incluye ordenamiento ---
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

    // --- MODIFICADO: Estados de Carga y Error ---
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

            {/* --- Filtros de la tabla --- */}
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

            {/* --- Tabla de Productos --- */}
            <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-gray-400">
                    
                    {/* --- MODIFICADO: thead con Ordenamiento --- */}
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

                    {/* --- MODIFICADO: tbody con Estado Vacío y Botones --- */}
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
                                        
                                        {/* --- MODIFICADO: Usando StatusBadge --- */}
                                        <td className="px-6 py-4"><StatusBadge status={status} /></td>
                                        
                                        {/* --- MODIFICADO: Columna de Acciones --- */}
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
                            // --- AÑADIDO: Estado Vacío ---
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
                // Pasamos el estado local para que el modal lo use
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
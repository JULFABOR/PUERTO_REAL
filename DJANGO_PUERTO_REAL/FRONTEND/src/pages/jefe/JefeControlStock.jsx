import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle,
    faExchangeAlt,
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faInbox
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';
import useDebounce from '../../hooks/useDebounce'; // Asegúrate que la ruta sea correcta

// --- Importa los modales ---
import AddStockModal from '../../components/modals/AddStockModal'; // Asumiendo que está en la misma carpeta ahora
import AdjustStockModal from '../../components/modals/AdjustStockModal'; // Asumiendo que está en la misma carpeta ahora

// --- FUNCIÓN getStatus ---
const getStatus = (product) => {
    const stock = product.total_stock || 0;
    // Usamos un valor por defecto seguro para low_stock_threshold si no existe
    const lowStockThreshold = product.low_stock_threshold || 10;
    if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-600/20 text-red-300', value: 'out' };
    if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-600/20 text-yellow-300', value: 'low' };
    return { text: 'En Stock', className: 'bg-green-600/20 text-green-300', value: 'stock' };
};

const JefeControlStock = () => {
    // --- ESTADOS ---
    const [products, setProducts] = useState([]); // Productos para la tabla (puede ser paginado/filtrado por API)
    const [allProducts, setAllProducts] = useState([]); // Todos los productos para stats y modales
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);

    // Estados para modales
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);

    // Estados para filtros y búsqueda
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableSelectedCategory, setTableSelectedCategory] = useState('');
    const [tableSelectedStatus, setTableSelectedStatus] = useState(''); // Filtro frontend
    const debouncedSearchTerm = useDebounce(tableSearchTerm, 500); // Búsqueda backend

    // Estado para el modal AddStock
    const initialAddStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: 'Compra a proveedor' };
    const [addStockState, setAddStockState] = useState(initialAddStockState);


    // --- LÓGICA DE DATOS ---
    const fetchData = useCallback(async () => {
        // Solo muestra spinner en la carga inicial
        setError(null);
        try {
             // Parámetros para la API (búsqueda y categoría)
             const params = new URLSearchParams();
             if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
             if (tableSelectedCategory) params.append('categoria_producto', tableSelectedCategory);

            // Peticiones en paralelo
            const [productsData, categoriesData] = await Promise.all([
                apiClient(`/api/stock/productos/?${params.toString()}`),
                apiClient('/api/stock/categorias/')
            ]);

            // Procesamiento de productos
            // Asumimos que la API puede devolver paginación ({results: [], count: X}) o una lista simple ([])
            let productList = [];
            if (productsData && Array.isArray(productsData.results)) {
                 productList = productsData.results;
                 // TODO: Si tu API devuelve paginación, necesitarás usar `productsData.count`
                 // y lógica de paginación aquí si quieres mostrarla.
            } else if (productsData && Array.isArray(productsData)) {
                 productList = productsData;
            }
            setProducts(productList); // Para la tabla
            // Necesitamos *todos* los productos para las stats si la API está paginada
            // Si la API NO pagina con filtros, podemos usar productList directamente
            // Si SÍ pagina, necesitaríamos otra llamada sin paginación para las stats,
            // o calcularlas en el backend. Por ahora, asumimos que `products` tiene todo.
            setAllProducts(productList); // Para stats y modales

            // Procesamiento de categorías
            setCategories(categoriesData.results || categoriesData || []);

        } catch (err) {
            console.error("Fetch Error:", err); // Log detallado del error
            toast.error("Error al cargar los datos. Revisa la consola.");
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, tableSelectedCategory]); // Dependencias del fetch

    // Efecto para cargar datos iniciales y cuando cambian los filtros de backend
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Efecto para obtener datos del usuario al montar
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, []);

    // --- MANEJO DE MODALES ---
    const handleSuccess = () => {
        setShowAddStockModal(false);
        setShowAdjustStockModal(false);
        fetchData(); // Refresca los datos después de una operación exitosa
    };

    const openAddStockModal = (product) => {
        if (product) {
            setAddStockState({
                ...initialAddStockState,
                selectedProduct: product,
                searchTerm: `${product.nombre_producto} (SKU: ${product.barcode || 'N/A'})`, // Muestra SKU si existe
            });
        } else {
            setAddStockState(initialAddStockState); // Abre modal vacío
        }
        setShowAddStockModal(true);
    };

    // --- LÓGICA AUXILIAR ---

    // Cálculo de Estadísticas
    const stats = useMemo(() => {
        const productList = allProducts; // Usa la lista completa
        const inventoryValue = productList.reduce((acc, p) => acc + ((p.precio_unitario_venta_producto || 0) * (p.total_stock || 0)), 0);
        const uniqueProducts = productList.length;
        const lowStockAlerts = productList.filter(p => getStatus(p).value === 'low').length;
        const outOfStockProducts = productList.filter(p => getStatus(p).value === 'out').length;
        return { inventoryValue, uniqueProducts, lowStockAlerts, outOfStockProducts };
    }, [allProducts]);

     // Filtrado Frontend (solo por estado, ya que backend maneja search/cat)
     const tableFilteredProducts = useMemo(() => {
         return products.filter(p => {
             const statusMatch = !tableSelectedStatus || getStatus(p).value === tableSelectedStatus;
             return statusMatch;
         });
     }, [products, tableSelectedStatus]);

    // Formateo de moneda
    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- RENDERIZADO ---
    if (loading && products.length === 0) { // Muestra spinner solo en carga inicial
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
                        className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors"
                    >
                        <FontAwesomeIcon icon={faPlusCircle} />
                        <span>Agregar Stock</span>
                    </button>
                    <button
                        onClick={() => setShowAdjustStockModal(true)}
                        className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 transition-colors"
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
                    placeholder="Buscar por Nombre o SKU..." // Placeholder actualizado
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
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3">Categoría</th>
                            <th scope="col" className="px-6 py-3">Precio Venta</th>
                            <th scope="col" className="px-6 py-3">Stock Total</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
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
                                        <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${status.className}`}>{status.text}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openAddStockModal(product)}
                                                className="p-2 w-9 h-9 flex items-center justify-center bg-pr-dark rounded-lg text-pr-yellow hover:bg-gray-700 transition-colors"
                                                title="Agregar stock a este producto"
                                            >
                                                <FontAwesomeIcon icon={faPlus} />
                                            </button>
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
            {/* Asegúrate que las props userData y allProducts se pasen correctamente */}
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

            <AdjustStockModal
                isOpen={showAdjustStockModal}
                onClose={() => setShowAdjustStockModal(false)}
                onSuccess={handleSuccess}
                allProducts={allProducts}
                userData={userData}
            />
        </>
    );
};

export default JefeControlStock;
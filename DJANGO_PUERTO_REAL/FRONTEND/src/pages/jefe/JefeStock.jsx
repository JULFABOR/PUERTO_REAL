import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSpinner, faInbox, faCogs } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { Datepicker, Card } from 'flowbite-react';
import Chart from 'react-apexcharts';
import apiClient from '../../api/apiClient';
import useDebounce from '../../hooks/useDebounce';

import NewProductModal from '@/components/Modals/Stock/NewProductModal';
import EditProductModal from '@/components/Modals/Stock/EditProductModal';
import CategoryManagerModal from '@/components/Modals/Stock/CategoryManagerModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';

const getStatus = (product) => {
    const stock = product.total_stock || 0;
    const lowStockThreshold = product.low_stock_threshold || 10;
    if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-900 text-red-300' };
    if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-900 text-yellow-300' };
    return { text: 'En Stock', className: 'bg-green-900 text-green-300' };
};

const JefeStock = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // State for dashboard
    const [stockSummary, setStockSummary] = useState(null);
    const [productSalesPerformance, setProductSalesPerformance] = useState([]);
    const [topProductsByStock, setTopProductsByStock] = useState([]);
    const [startDate, setStartDate] = useState(subDays(new Date(), 30));
    const [endDate, setEndDate] = useState(new Date());

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page };
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;
            if (selectedCategory) params.categoria_producto = selectedCategory;
            
            const response = await apiClient.get('/stock/productos/', { params });
            const data = response.data;

            if (data && Array.isArray(data.results)) {
                setProducts(data.results);
                setTotalProducts(data.count);
                setTotalPages(Math.ceil((data.count || 0) / 10));
            } else {
                setProducts([]);
                setTotalProducts(0);
                setTotalPages(1);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "No se pudieron cargar los productos.";
            toast.error(errorMsg);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, selectedCategory]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const formattedStartDate = format(startDate, 'yyyy-MM-dd');
            const formattedEndDate = format(endDate, 'yyyy-MM-dd');

            // Fetch summary, sales performance, and top products in parallel
            const [summaryResponse, salesResponse, topProductsResponse] = await Promise.all([
                apiClient.get('/stock/stock-movement-summary/', {
                    params: { start_date: formattedStartDate, end_date: formattedEndDate },
                }),
                apiClient.get('/ventas/sales-performance/', {
                    params: { start_date: formattedStartDate, end_date: formattedEndDate, limit: 5 },
                }),
                apiClient.get('/stock/top-products-by-stock/', {
                    params: { limit: 10, order_by: '-total_stock' },
                }),
            ]);
            
            setStockSummary(summaryResponse.data);
            setProductSalesPerformance(salesResponse.data);
            setTopProductsByStock(topProductsResponse.data);

        } catch (error) {
            toast.error("No se pudieron cargar los datos del dashboard.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await apiClient.get('/stock/categorias/');
            const categoriesData = response.data;
            setCategories(categoriesData.results || categoriesData || []);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "No se pudieron cargar las categorías.";
            toast.error(errorMsg);
        }
    }, []);

    const refreshAllData = useCallback(() => {
        fetchProducts(currentPage);
        fetchCategories();
        fetchDashboardData();
    }, [currentPage, fetchProducts, fetchCategories, fetchDashboardData]);

    useEffect(() => {
        fetchProducts(1);
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedCategory]);

    useEffect(() => {
        fetchCategories();
        fetchDashboardData();
    }, [fetchCategories, fetchDashboardData]);
    
    useEffect(() => {
        // Este efecto se dispara solo cuando cambia la página, excepto en la carga inicial
        // que es manejada por el efecto anterior.
        if (currentPage > 1) {
            fetchProducts(currentPage);
        }
    }, [currentPage]);
    
    const handleEditClick = (product) => {
        setProductToEdit(product);
        setShowEditProductModal(true);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const formatCurrency = (value) => `${parseFloat(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const handleDeleteRequest = (product) => {
        setProductToDelete(product);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await apiClient.delete(`/stock/productos/${productToDelete.id_producto}/`);
            toast.success(`Producto "${productToDelete.nombre_producto}" eliminado.`);
            
            // Recalcular si debemos cambiar de página
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchProducts(currentPage);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al eliminar el producto.';
            toast.error(errorMsg);
        } finally {
            setProductToDelete(null);
        }
    };

    // ApexCharts options and series for Product Sales Performance (Bar Chart)
    const salesProductNames = productSalesPerformance.map(item => item.product_name);
    const salesQuantities = productSalesPerformance.map(item => item.total_quantity_sold);

    const salesPerformanceOptions = {
        chart: {
            id: 'sales-performance-chart',
            toolbar: { show: false },
            foreColor: '#9CA3AF'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: salesProductNames,
            title: { text: 'Producto', style: { color: '#9CA3AF' } },
            labels: { style: { colors: '#9CA3AF' } }
        },
        yaxis: {
            title: { text: 'Cantidad Vendida', style: { color: '#9CA3AF' } },
            labels: { style: { colors: '#9CA3AF' } }
        },
        fill: {
            opacity: 1,
            colors: ['#FBBF24']
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val) => `${val} unidades`
            }
        },
        grid: {
            borderColor: '#4B5563',
            row: { colors: ['transparent', 'transparent'], opacity: 0.5 },
            column: { colors: ['transparent', 'transparent'], opacity: 0.5 }
        },
    };

    const salesPerformanceSeries = [{
        name: 'Cantidad Vendida',
        data: salesQuantities
    }];

    return (
        <>
            <div className="bg-pr-dark-gray p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Dashboard y Gestión de Stock</h2>

                {/* Dashboard Section */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Resumen Estratégico</h3>
                    <div className="mb-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Desde:</label>
                            <Datepicker
                                id="startDate"
                                value={format(startDate, 'dd/MM/yyyy')}
                                onSelectedDateChanged={date => setStartDate(date)}
                                labelTodayButton="Hoy"
                                labelClearButton="Limpiar"
                                maxDate={endDate}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">Hasta:</label>
                            <Datepicker
                                id="endDate"
                                value={format(endDate, 'dd/MM/yyyy')}
                                onSelectedDateChanged={date => setEndDate(date)}
                                labelTodayButton="Hoy"
                                labelClearButton="Limpiar"
                                minDate={startDate}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         <Card className="bg-pr-dark border border-gray-700">
                            <h5 className="text-xl font-bold tracking-tight text-white">
                                Total Entradas
                            </h5>
                            <p className="text-3xl font-bold text-pr-yellow">
                                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : stockSummary?.total_entries ?? '0'}
                            </p>
                            <p className='text-gray-400 text-sm'>
                                {format(startDate, 'dd/MM/yy')} - {format(endDate, 'dd/MM/yy')}
                            </p>
                        </Card>
                        <Card className="bg-pr-dark border border-gray-700">
                            <h5 className="text-xl font-bold tracking-tight text-white">
                                Total Salidas
                            </h5>
                            <p className="text-3xl font-bold text-pr-yellow">
                                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : stockSummary?.total_exits ?? '0'}
                            </p>
                             <p className='text-gray-400 text-sm'>
                                {format(startDate, 'dd/MM/yy')} - {format(endDate, 'dd/MM/yy')}
                            </p>
                        </Card>
                        <Card className="bg-pr-dark border border-gray-700">
                           <h5 className="text-xl font-bold tracking-tight text-white">
                                Variación Neta
                            </h5>
                            <p className="text-3xl font-bold text-pr-yellow">
                                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : stockSummary ? (stockSummary.total_entries - stockSummary.total_exits) : '0'}
                            </p>
                             <p className='text-gray-400 text-sm'>
                                {format(startDate, 'dd/MM/yy')} - {format(endDate, 'dd/MM/yy')}
                            </p>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                    <div className="lg:col-span-3">
                        <Card className="bg-pr-dark border border-gray-700 h-full">
                            <h5 className="text-xl font-bold tracking-tight text-white mb-4">
                                Top 5 Productos Más Vendidos
                            </h5>
                            {loading ? (
                                <div className="flex justify-center items-center h-full text-pr-yellow">
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
                                </div>
                            ) : (
                                <Chart options={salesPerformanceOptions} series={salesPerformanceSeries} type="bar" height={350} />
                            )}
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="bg-pr-dark border border-gray-700 h-full">
                            <h5 className="text-xl font-bold tracking-tight text-white mb-4">
                                Productos con Mayor Stock
                            </h5>
                            {loading ? (
                                <div className="flex justify-center items-center h-full text-pr-yellow">
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl" />
                                </div>
                            ) : (
                                <div className="overflow-y-auto h-[350px]">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-800 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Producto</th>
                                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {topProductsByStock.map(product => (
                                                <tr key={product.id_producto}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{product.nombre_producto}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">{product.total_stock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                <hr className="border-gray-700 my-6" />

                {/* Panel de Control de Productos */}
                <div className="bg-pr-dark p-4 rounded-lg mb-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Gestión de Productos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o SKU..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="lg:col-span-2 w-full p-2 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-pr-yellow focus:border-pr-yellow" 
                        />
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-pr-yellow focus:border-pr-yellow">
                            <option value="">Todas las categorías</option>
                            {categories.map(category => (
                                <option key={category.id_categoria} value={category.id_categoria}>{category.nombre_categoria}</option>
                            ))}
                        </select>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <button onClick={() => setShowCategoryModal(true)} className="btn-secondary w-full text-sm">
                                <FontAwesomeIcon icon={faCogs} className="mr-2" />
                                Categorías
                            </button>
                            <button onClick={() => setShowNewProductModal(true)} className="btn-primary w-full text-sm">
                                <FontAwesomeIcon icon={faPlus} className="mr-2"/>
                                Nuevo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenido Principal */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-pr-yellow">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => {
                                const status = getStatus(product); 
                                return (
                                    <div 
                                        key={product.id_producto} 
                                        className="bg-pr-dark rounded-lg shadow-lg flex flex-col border border-gray-700 transition-all duration-300 hover:shadow-pr-yellow/20 hover:border-pr-yellow/50"
                                    >
                                        <img 
                                            className="w-full h-48 object-cover rounded-t-lg" 
                                            src={product.image || 'https://via.placeholder.com/150'} 
                                            alt={product.nombre_producto} 
                                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150'; }}
                                        />
                                        <div className="p-4 flex flex-col flex-grow justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">{product.categoria_producto?.nombre_categoria || 'Sin categoría'}</p>
                                                <h3 className="text-lg font-bold text-white mb-2 h-14 overflow-hidden">{product.nombre_producto}</h3>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${status.className}`}>
                                                        {status.text}
                                                    </span>
                                                    <span className="text-lg font-bold text-gray-300">{product.total_stock || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <p className="text-2xl font-semibold text-pr-yellow">{formatCurrency(product.precio_unitario_venta_producto)}</p>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(product)}
                                                        className="text-sm text-pr-yellow border border-pr-yellow rounded-md px-4 py-1.5 font-semibold hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRequest(product)}
                                                        className="text-red-500 border border-red-500 rounded-md px-2 py-1.5 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center h-full aspect-square"
                                                        title="Eliminar producto"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
                                <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalProducts} productos)</span>
                                <div className="inline-flex -space-x-px">
                                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-l-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                        Anterior
                                    </button>
                                    <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-r-lg hover:bg-gray-800 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-16 bg-pr-dark rounded-lg border border-dashed border-gray-700">
                        <FontAwesomeIcon icon={faInbox} className="text-5xl text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
                        <p className="text-gray-400">Intenta ajustar tu búsqueda o crea un nuevo producto.</p>
                    </div>
                )}
            </div>
            
            {/* Modales */}
            <NewProductModal 
                isOpen={showNewProductModal}
                onClose={() => setShowNewProductModal(false)}
                onSuccess={() => {
                    setShowNewProductModal(false);
                    fetchProducts(1);
                    setCurrentPage(1);
                }}
                categories={categories}
            />
            <EditProductModal
                isOpen={showEditProductModal}
                onClose={() => setShowEditProductModal(false)}
                onSuccess={() => {
                    setShowEditProductModal(false);
                    fetchProducts(currentPage);
                }}
                product={productToEdit}
                categories={categories}
            />
            <CategoryManagerModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                categories={categories}
                onDataChange={refreshAllData}
            />
            <ConfirmDeleteModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={handleConfirmDelete}
                itemName={productToDelete?.nombre_producto}
            />
        </>
    );
};

export default JefeStock;
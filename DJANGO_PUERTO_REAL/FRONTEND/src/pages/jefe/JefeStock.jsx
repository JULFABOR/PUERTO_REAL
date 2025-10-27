import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faTrash, 
    faSpinner,
    faInbox 
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';
import useDebounce from '../../hooks/useDebounce'; // Asegúrate que la ruta sea correcta

// Importar todos los componentes de los modales
import NewProductModal from '../../components/Modals/NewProductModal';
import EditProductModal from '../../components/Modals/EditProductModal';
import CategoryManagerModal from '../../components/Modals/CategoryManagerModal';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';

// --- FUNCIÓN getStatus (AÑADIDA PARA EL JEFE TAMBIÉN) ---
const getStatus = (product) => {
    const stock = product.total_stock || 0;
    const lowStockThreshold = product.low_stock_threshold || 10; 
    if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-900 text-red-300' };
    if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-900 text-yellow-300' };
    return { text: 'En Stock', className: 'bg-green-900 text-green-300' };
};


const JefeStock = () => {
    // --- ESTADOS --- (Sin cambios)
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

    // --- LÓGICA DE DATOS --- (Sin cambios)
    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page });
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (selectedCategory) params.append('categoria_producto', selectedCategory);
            
            const data = await apiClient(`/api/stock/productos/?${params.toString()}`);
            
            if (data && Array.isArray(data.results)) {
                setProducts(data.results);
                setTotalProducts(data.count);
                setTotalPages(Math.ceil((data.count || 0) / 10));
            } else if (data && Array.isArray(data)) {
                setProducts(data);
                setTotalProducts(data.length);
                setTotalPages(1);
                setCurrentPage(1);
            } else {
                setProducts([]);
            }
        } catch (error) {
            toast.error("No se pudieron cargar los productos.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, selectedCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const categoriesData = await apiClient('/api/stock/categorias/');
            setCategories(categoriesData.results || categoriesData || []); // Asegura que sea un array
        } catch (error) {
            toast.error("No se pudieron cargar las categorías.");
        }
    }, []);

    const refreshAllData = useCallback(() => {
        fetchProducts(currentPage);
        fetchCategories();
    }, [fetchProducts, fetchCategories, currentPage]);

    useEffect(() => {
        fetchProducts(1);
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedCategory]);

    useEffect(() => {
        if (currentPage > 1 || (currentPage === 1 && products.length === 0)) { // Condición para evitar doble carga inicial
             fetchProducts(currentPage);
        }
    }, [currentPage, fetchProducts]); // Añadido fetchProducts
    
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- LÓGICA DE INTERACCIÓN --- (Sin cambios)
    const handleEditClick = (product) => {
        setProductToEdit(product);
        setShowEditProductModal(true);
    };

    const handleDeleteRequest = (product) => {
        setProductToDelete(product);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await apiClient(`/api/stock/productos/${productToDelete.id_producto}/`, { method: 'DELETE' });
            toast.success(`Producto "${productToDelete.nombre_producto}" eliminado.`);
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchProducts(currentPage);
            }
        } catch (error) {
            toast.error('Error al eliminar el producto.');
        } finally {
            setProductToDelete(null);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const formatCurrency = (value) => `$${parseFloat(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            {/* --- CABECERA Y FILTROS --- (Sin cambios) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Catálogo de Productos</h1>
                <button onClick={() => setShowNewProductModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Agregar Nuevo Producto</span>
                </button>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="flex-grow p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" 
                />
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                        <option key={category.id_categoria} value={category.id_categoria}>{category.nombre_categoria}</option>
                    ))}
                </select>
                <button onClick={() => setShowCategoryModal(true)} className="text-white bg-gray-700 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 shrink-0">
                    Gestionar Categorías
                </button>
            </div>

            {/* --- LISTA DE PRODUCTOS Y PAGINACIÓN --- */}
            {loading ? (
                <div className="flex justify-center items-center h-64 text-pr-yellow">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
                </div>
            ) : products.length > 0 ? (
                <>
                    {/* --- GRID DE TARJETAS (ESTILO EMPLEADO) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            const status = getStatus(product); 
                            return (
                                <div 
                                    key={product.id_producto} 
                                    className="bg-pr-dark rounded-lg shadow-lg flex flex-col border border-gray-700 transition-all duration-300 hover:shadow-pr-yellow/20"
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
                                            <h3 className="text-lg font-bold text-white mb-2 h-14 overflow-hidden">{product.nombre_producto}</h3> {/* Alto fijo para alinear */}
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${status.className}`}>
                                                    {status.text}
                                                </span>
                                                <span className="text-lg font-bold text-gray-300">{product.total_stock || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <p className="text-2xl font-semibold text-pr-yellow">{formatCurrency(product.precio_unitario_venta_producto)}</p>
                                            
                                            {/* --- BOTONES DE ACCIÓN (EDITAR Y ELIMINAR) --- */}
                                            <div className="flex items-center gap-2"> {/* Mantenemos gap-2 */}
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
                                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" /> {/* Tamaño explícito del icono */}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* --- Paginación --- (Sin cambios) */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
                            <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalProducts} productos)</span>
                            <div className="inline-flex -space-x-px">
                                <p className="text-2xl font-semibold text-pr-yellow">{formatCurrency(product.precio_unitario_venta_producto)}</p>
                                <p className="text-2xl font-semibold text-pr-yellow">{formatCurrency(product.precio_unitario_venta_producto)}</p>
                                    <button 
                                        onClick={() => handleEditClick(product)} 
                                        className="text-sm text-pr-yellow border border-pr-yellow rounded-md px-4 py-1.5 font-semibold hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                    >
                                        Editar
                                    </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-pr-gray py-16 bg-pr-dark rounded-lg border border-pr-gray/20">
                    <FontAwesomeIcon icon={faInbox} className="text-5xl text-pr-gray/50 mb-4" />
                    <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
                    <p>Intenta ajustar tu búsqueda o crea un nuevo producto.</p>
                </div>
            )}
            
            {/* --- RENDERIZADO DE MODALES --- (Sin cambios) */}
            <NewProductModal 
                isOpen={showNewProductModal}
                onClose={() => setShowNewProductModal(false)}
                onSuccess={() => {
                    setShowNewProductModal(false);
                    fetchProducts(1);
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
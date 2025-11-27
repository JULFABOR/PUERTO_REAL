import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons'; // Simplificado
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios

// Componentes
import ProductImage from '@/components/ProductImage';

// Importamos los modales
import NewProductModal from  '@/components/Modals/Stock/NewProductModal';
import EditProductModal from  '@/components/Modals/Stock/EditProductModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
import CategoryManagerModal from '@/components/Modals/Stock/CategoryManagerModal';

// Función getStatus (sin cambios)
const getStatus = (product) => {
    const stock = product.total_stock || 0;
    const lowStockThreshold = product.low_stock_threshold || 10; 
    if (stock === 0) return { text: 'Sin Stock', className: 'bg-red-900 text-red-300' };
    if (stock > 0 && stock <= lowStockThreshold) return { text: 'Stock Bajo', className: 'bg-yellow-900 text-yellow-300' };
    return { text: 'En Stock', className: 'bg-green-900 text-green-300' };
};

const EmpleadoStock = () => {
    // --- ESTADOS (Sin cambios) ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productToDelete, setProductToDelete] = useState(null);

    // --- LÓGICA DE DATOS (REFACTORIZADA) ---
    
    // --- CAMBIO 1: fetchProducts con Axios ---
    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            // Construimos los parámetros para Axios
            const params = {
                page: page,
            };
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.categoria_producto = selectedCategory;
            
            // Antes: const data = await apiClient(`/api/stock/productos/?${params.toString()}`);
            // Ahora:
            const response = await apiClient.get('/stock/productos/', { params });
            const data = response.data; // Los datos están en response.data

            if (data && Array.isArray(data.results)) {
                setProducts(data.results);
                setTotalProducts(data.count);
                setTotalPages(Math.ceil((data.count || 0) / 10)); 
            } else if (data && Array.isArray(data)) {
                // Manejo para backends no paginados
                setProducts(data);
                setTotalProducts(data.length);
                setTotalPages(1);
                setCurrentPage(1);
            } else {
                setProducts([]);
            }
        } catch (error) {
            // Mejoramos el manejo de error de Axios
            const errorMsg = error.response?.data?.detail || "No se pudieron cargar los productos.";
            toast.error(errorMsg);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory]); // Dependencias correctas

    // --- CAMBIO 2: fetchCategories con Axios ---
    const fetchCategories = useCallback(async () => {
        try {
            // Antes: const categoriesData = await apiClient('/api/stock/categorias/');
            // Ahora:
            const response = await apiClient.get('/stock/categorias/');
            const categoriesData = response.data; // Datos en response.data
            
            setCategories(categoriesData.results || categoriesData || []);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "No se pudieron cargar las categorías.";
            toast.error(errorMsg);
        }
    }, []);

    const refreshAllData = useCallback(() => {
        fetchProducts(currentPage);
        fetchCategories();
    }, [currentPage, fetchProducts, fetchCategories]);


    // --- EFECTOS (Sin cambios) ---
    useEffect(() => {
        fetchProducts(1);
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, fetchProducts]); // fetchProducts añadido

    useEffect(() => {
        // Ajustamos la lógica para evitar doble carga inicial
        if (currentPage > 1) {
            fetchProducts(currentPage);
        }
    }, [currentPage, fetchProducts]);
    
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- LÓGICA DE INTERACCIÓN ---
    
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

    const formatCurrency = (value) => `$${parseFloat(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const handleDeleteRequest = (product) => {
        setProductToDelete(product);
    };

    // --- CAMBIO 3: handleConfirmDelete con Axios ---
    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            // Antes: await apiClient(url, { method: 'DELETE' });
            // Ahora:
            await apiClient.delete(`/stock/productos/${productToDelete.id_producto}/`);
            
            toast.success(`Producto "${productToDelete.nombre_producto}" eliminado.`);
            
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1); // Esto disparará el useEffect de currentPage
            } else {
                await fetchProducts(currentPage); // Recarga la página actual
            }
        } catch (error) {
            // Mejoramos el manejo de error de Axios
            const errorMsg = error.response?.data?.detail || 'Error al eliminar el producto.';
            toast.error(errorMsg);
        } finally {
            setProductToDelete(null); // Cierra el modal
        }
    };

    // --- RENDERIZADO (Sin cambios) ---
    return (
        <>
            {/* --- CABECERA Y FILTROS --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Catálogo de Productos</h1>
                <button onClick={() => setShowNewProductModal(true)} className="btn-primary w-full sm:w-auto">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Agregar Nuevo Producto</span>
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" />
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                        <option key={category.id_categoria} value={category.id_categoria}>{category.nombre_categoria}</option>
                    ))}
                </select>
                <button 
                    onClick={() => setShowCategoryModal(true)} 
                    className="text-white bg-gray-700 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 shrink-0"
                >
                    Gestionar Categorías
                </button>
            </div>

            {/* --- LISTA DE PRODUCTOS Y PAGINACIÓN --- */}
            {loading ? (
                <div className="text-center text-white py-10">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-pr-yellow" />
                </div>
            ) : products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            const status = getStatus(product); 
                            return (
                                <div 
                                    key={product.id_producto} 
                                    className="bg-pr-dark rounded-lg shadow-lg flex flex-col border border-gray-700 transition-all duration-300 hover:shadow-pr-yellow/20"
                                >
                                    <ProductImage
                                        imagenProducto={product.imagen_producto}
                                        imagenUrl={product.imagen_url}
                                        nombreProducto={product.nombre_producto}
                                        className="w-full h-48"
                                        showPlaceholder={true}
                                    />
                                    <div className="p-4 flex flex-col flex-grow justify-between">
                                        <div>
                                            <p className="text-sm text-gray-300 mb-1">{product.categoria_producto?.nombre_categoria || 'Sin categoría'}</p>
                                            <h3 className="text-lg font-bold text-white mb-2 h-14">{product.nombre_producto}</h3>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${status.className}`}>
                                                    {status.text}
                                                </span>
                                                <span className="text-lg font-bold text-gray-300">{product.total_stock || 0}</span>
                                            </div>
                                        </div>
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
                            );
                        })}
                    </div>

                    {/* --- Paginación --- */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 text-sm text-gray-300">
                            <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalProducts} productos)</span>
                            <div className="inline-flex -space-x-px">
                                <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-l-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                    Anterior
                                </button>
                                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-r-lg hover:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-gray-300 py-10 bg-pr-dark rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
                    <p>Intenta ajustar tu búsqueda o crea un nuevo producto.</p>
                </div>
            )}
            
            {/* --- RENDERIZADO DE MODALES --- */}
            <NewProductModal 
                isOpen={showNewProductModal}
                onClose={() => setShowNewProductModal(false)}
                onSuccess={() => fetchProducts(1)}
                categories={categories}
            />
            
            <EditProductModal
                isOpen={showEditProductModal}
                onClose={() => setShowEditProductModal(false)}
                onSuccess={() => fetchProducts(currentPage)}
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

export default EmpleadoStock;
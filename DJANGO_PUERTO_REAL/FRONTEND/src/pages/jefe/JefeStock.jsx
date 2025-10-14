import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

// Importar todos los componentes de los modales
import NewProductModal from '../../components/Modals/NewProductModal';
import EditProductModal from '../../components/Modals/EditProductModal';
import CategoryManagerModal from '../../components/Modals/CategoryManagerModal';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';

const JefeStock = () => {
    // --- ESTADOS ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Estados para modales
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // --- LÓGICA DE DATOS ---
    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page });
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('categoria_producto', selectedCategory);
            
            const data = await apiClient(`/api/stock/productos/?${params.toString()}`);
            
            if (data && Array.isArray(data.results)) {
                setProducts(data.results);
                setTotalProducts(data.count);
                setTotalPages(Math.ceil((data.count || 0) / 10)); // Asumiendo 10 por página
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
    }, [searchTerm, selectedCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const categoriesData = await apiClient('/api/stock/categorias/');
            setCategories(categoriesData || []);
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
    }, [searchTerm, selectedCategory]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);
    
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- LÓGICA DE INTERACCIÓN ---
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
            await fetchProducts(currentPage); // Usar await para asegurar la recarga
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

    const formatCurrency = (value) => `$${parseFloat(value || 0).toLocaleString('es-AR')}`;

    return (
        <>
            {/* --- CABECERA Y FILTROS --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Catálogo de Productos</h1>
                <button onClick={() => setShowNewProductModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
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
                <button onClick={() => setShowCategoryModal(true)} className="text-white bg-gray-700 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 shrink-0">
                    Gestionar Categorías
                </button>
            </div>

            {/* --- LISTA DE PRODUCTOS Y PAGINACIÓN --- */}
            {loading ? (
                <div className="text-center text-white py-10">Cargando...</div>
            ) : products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product.id_producto} className="bg-pr-dark rounded-lg shadow-lg flex hover:ring-2 ring-pr-yellow transition-all duration-300">
                                <img className="w-1/3 object-cover rounded-l-lg" src={product.image || 'https://via.placeholder.com/150'} alt={product.nombre_producto} />
                                <div className="p-4 flex flex-col justify-between w-2/3">
                                    <div>
                                        <p className="text-sm text-pr-gray mb-1">{product.categoria_producto?.nombre_categoria || 'Sin categoría'}</p>
                                        <h3 className="text-lg font-bold text-white mb-2">{product.nombre_producto}</h3>
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold text-pr-yellow mb-4">{formatCurrency(product.precio_unitario_venta_producto)}</p>
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => handleEditClick(product)} className="text-sm text-pr-yellow hover:underline">Editar</button>
                                            <button onClick={() => handleDeleteRequest(product)} className="text-red-500 hover:text-red-400">
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
                            <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalProducts} productos)</span>
                            <div className="inline-flex -space-x-px">
                                <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-l-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                    Anterior
                                </button>
                                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-3 py-2 leading-tight bg-pr-dark border border-gray-700 rounded-r-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                 <div className="text-center text-gray-400 py-10 bg-pr-dark rounded-lg">
                    <h3 className="text-xl font-bold">No se encontraron productos</h3>
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

export default JefeStock;
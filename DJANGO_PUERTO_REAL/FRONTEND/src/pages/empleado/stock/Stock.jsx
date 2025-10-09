import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Se elimina useNavigate porque ya no se usa
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';

const Stock = () => {
    // --- ESTADOS ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');

    // Estado para el modal de CREACIÓN
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        nombre_producto: '',
        descripcion_producto: '',
        precio_unitario_compra_producto: '',
        precio_unitario_venta_producto: '',
        categoria_producto_id: '',
        low_stock_threshold: 10,
        barcode: '',
        stock_adquirido: '',
    });

    // Estado para el modal de EDICIÓN (NUEVO)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);


    // --- LÓGICA DE DATOS ---

    // MEJORA: useCallback para estabilizar la función
    const fetchProductsAndCategories = useCallback(async () => {
        try {
            const [productsData, categoriesData] = await Promise.all([
                apiClient('/api/stock/productos/'),
                apiClient('/api/stock/categorias/'),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (_) {
            setError('Ocurrió un error al cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchProductsAndCategories();
    }, [fetchProductsAndCategories]);

    // MEJORA: useMemo para optimizar el rendimiento del filtrado
    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm]);


    // --- MANEJADORES DE EVENTOS ---

    // Lógica para CREAR
    const handleAddProduct = () => {
        setFormError('');
        setShowNewProductModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    // CORREGIDO: Lógica para enviar el payload correcto
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            let categoryId;
            const categoryName = newProduct.categoria_producto_id;
            const existingCategory = categories.find(cat => cat.nombre_categoria.toLowerCase() === categoryName.toLowerCase());

            if (existingCategory) {
                categoryId = existingCategory.id_categoria;
            } else {
                const newCategory = await apiClient('/api/stock/categorias/', {
                    method: 'POST', body: JSON.stringify({ nombre_categoria: categoryName })
                });
                categoryId = newCategory.id_categoria;
                setCategories(prev => [...prev, newCategory]);
            }
            
            // CORREGIDO: Payload explícito para evitar errores de campos requeridos
            const payload = {
                nombre_producto: newProduct.nombre_producto,
                barcode: newProduct.barcode,
                precio_unitario_compra_producto: newProduct.precio_unitario_compra_producto,
                precio_unitario_venta_producto: newProduct.precio_unitario_venta_producto,
                stock_actual: newProduct.stock_adquirido,
                stock_adquirido: newProduct.stock_adquirido,
                categoria_producto: categoryId, // Corregido aquí
                descripcion_producto: newProduct.descripcion_producto || "Sin descripción",
                low_stock_threshold: newProduct.low_stock_threshold || 10,
                estado_producto: 23, // ID para estado "Activo" o similar
            };

            await apiClient('/api/stock/productos/', { method: 'POST', body: JSON.stringify(payload) });
            
            setShowNewProductModal(false);
            fetchProductsAndCategories();
            setNewProduct({
                nombre_producto: '',
                descripcion_producto: '',
                precio_unitario_compra_producto: '',
                precio_unitario_venta_producto: '',
                categoria_producto_id: '',
                low_stock_threshold: 10,
                barcode: '',
                stock_adquirido: '',
            });
        } catch (err) {
            const errorMessage = err.data ? Object.values(err.data).flat().join('; ') : 'Error al guardar.';
            setFormError(errorMessage);
        }
    };

    // Lógica para EDITAR (NUEVO)
    const handleEditProduct = (product) => {
        setFormError('');
        setEditingProduct({ ...product, stock_adquirido: '' });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({ ...prev, [name]: value }));
    };
    
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!editingProduct) return;

        const stockAdquirido = parseInt(editingProduct.stock_adquirido, 10) || 0;
        const stockActual = parseInt(editingProduct.total_stock, 10);
        const nuevoTotalStock = stockActual + stockAdquirido;

        const payload = {
            nombre_producto: editingProduct.nombre_producto,
            barcode: editingProduct.barcode,
            precio_unitario_compra_producto: editingProduct.precio_unitario_compra_producto,
            precio_unitario_venta_producto: editingProduct.precio_unitario_venta_producto,
            total_stock: nuevoTotalStock,
        };

        try {
            await apiClient(`/api/stock/productos/${editingProduct.id_producto}/`, { method: 'PUT', body: JSON.stringify(payload) });
            setShowEditModal(false);
            setEditingProduct(null);
            fetchProductsAndCategories();
        } catch (err) {
            const errorMessage = err.data ? Object.values(err.data).flat().join('; ') : 'Error al actualizar.';
            setFormError(errorMessage);
        }
    };

    // Lógica para ELIMINAR (MEJORADO)
    const handleDeleteProduct = async (productId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await apiClient(`/api/stock/productos/${productId}/`, { method: 'DELETE' });
                fetchProductsAndCategories(); // MEJORA: Re-fetch para mayor consistencia
            } catch (_) {
                setError('Ocurrió un error al eliminar el producto.');
            }
        }
    };

    const getStockColor = (stock, threshold) => {
        if (stock > (threshold || 10)) return 'text-green-500';
        if (stock > 0) return 'text-yellow-500';
        return 'text-red-500';
    };


    // --- RENDERIZADO ---
    if (loading) return <p className="text-center text-pr-gray">Cargando productos...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Stock</h1>

            <div className="flex justify-between items-center mb-6">
                <div className="relative w-1/2">
                    <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow" />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                </div>
                <button onClick={handleAddProduct} className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center">
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Producto
                </button>
            </div>

            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left text-pr-gray">
                    <thead>
                        <tr className="border-b border-pr-gray/20">
                            <th className="p-4 text-left">Nombre</th>
                            <th className="p-4 text-left">SKU</th>
                            <th className="p-4 text-left">Categoría</th>
                            <th className="p-4 text-center">Stock</th>
                            <th className="p-4 text-right">Precio Venta</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id_producto} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                <td className="p-4 font-bold text-white">{product.nombre_producto}</td>
                                <td className="p-4 font-mono">{product.barcode || 'N/A'}</td>
                                <td className="p-4">{product.categoria_producto.nombre_categoria || 'N/A'}</td>
                                <td className={`p-4 font-bold text-center ${getStockColor(product.total_stock, product.low_stock_threshold)}`}>
                                    {product.total_stock}
                                </td>
                                <td className="p-4 text-right">${parseFloat(product.precio_unitario_venta_producto).toFixed(2)}</td>
                                <td className="p-4 flex justify-center items-center space-x-4">
                                    <button onClick={() => handleEditProduct(product)} className="text-blue-500 hover:text-blue-400">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id_producto)} className="text-red-600 hover:text-red-500">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL PARA CREAR PRODUCTO */}
            {showNewProductModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
                    {/* Este es el panel del modal en sí */}
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark text-white">
                            
                            {/* Encabezado del Modal */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-600">
                                <h3 className="text-xl font-semibold">Crear Nuevo Producto</h3>
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewProductModal(false)} 
                                    className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Cuerpo del Modal (Formulario) */}
                            <form className="p-4 space-y-4" onSubmit={handleCreateProduct}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Nombre del Producto</label>
                                        <input type="text" name="nombre_producto" value={newProduct.nombre_producto} onChange={handleChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">SKU / Código</label>
                                        <input type="text" name="barcode" value={newProduct.barcode} onChange={handleChange} className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Categoría</label>
                                        <input list="categories-list" name="categoria_producto_id" value={newProduct.categoria_producto_id} onChange={handleChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                        <datalist id="categories-list">
                                            {categories.map(c => <option key={c.id_categoria} value={c.nombre_categoria} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Stock Inicial</label>
                                        <input type="number" name="stock_adquirido" value={newProduct.stock_adquirido} onChange={handleChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Precio de Costo</label>
                                        <input type="number" step="0.01" name="precio_unitario_compra_producto" value={newProduct.precio_unitario_compra_producto} onChange={handleChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Precio Venta</label>
                                        <input type="number" step="0.01" name="precio_unitario_venta_producto" value={newProduct.precio_unitario_venta_producto} onChange={handleChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                </div>
                                {formError && <p className="text-red-500 text-center text-sm">{formError}</p>}
                                <button type="submit" className="w-full text-pr-dark bg-pr-yellow font-bold rounded-lg px-5 py-2.5 text-center hover:bg-opacity-90">
                                    Crear Producto
                                </button>
                            </form>

                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA EDITAR PRODUCTO (NUEVO) */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 border-b border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Editar Producto</h3>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <form className="p-4 space-y-4" onSubmit={handleUpdateProduct}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Nombre del Producto</label>
                                        <input type="text" name="nombre_producto" value={editingProduct.nombre_producto} onChange={handleEditChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">SKU / Código</label>
                                        <input type="text" name="barcode" value={editingProduct.barcode || ''} onChange={handleEditChange} className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Stock Actual</label>
                                        <input type="number" name="total_stock" value={editingProduct.total_stock} readOnly className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500 text-gray-400" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Stock Adquirido</label>
                                        <input type="number" name="stock_adquirido" value={editingProduct.stock_adquirido} onChange={handleEditChange} placeholder="0" className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Precio de Costo</label>
                                        <input type="number" step="0.01" name="precio_unitario_compra_producto" value={editingProduct.precio_unitario_compra_producto} onChange={handleEditChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Precio Venta</label>
                                        <input type="number" step="0.01" name="precio_unitario_venta_producto" value={editingProduct.precio_unitario_venta_producto} onChange={handleEditChange} required className="w-full bg-pr-dark-gray p-2.5 rounded border border-gray-500" />
                                    </div>
                                </div>
                                {formError && <p className="text-red-500 text-center text-sm">{formError}</p>}
                                <button type="submit" className="w-full text-pr-dark bg-pr-yellow font-bold rounded-lg px-5 py-2.5 text-center hover:bg-opacity-90">Actualizar Producto</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
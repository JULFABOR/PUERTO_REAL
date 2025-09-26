import React, { useState, useEffect, useCallback } from 'react'; // --> CAMBIO: Se añade useCallback
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import apiClient from '@/api/apiClient';

const JefeStock = () => {
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // --> CAMBIO 2: Centralizamos la lógica para obtener datos en una función
    const fetchData = useCallback(async () => {
        try {
            // Usamos Promise.all para hacer las 3 llamadas en paralelo, es más eficiente
            const [productsData, categoriesData, suppliersData] = await Promise.all([
                apiClient('/api/stock/productos/'),
                apiClient('/api/stock/categorias/'),
                apiClient('/api/compras/proveedores/')
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error("Hubo un error al cargar los datos:", error);
            // Aquí podrías establecer un estado de error para mostrar un mensaje en la UI
        }
    }, []);

    // El useEffect ahora solo llama a nuestra función fetchData
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --> CAMBIO 3: Convertimos la función a async/await y usamos apiClient para el POST
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const productData = {
            nombre_producto: formData.get('product-name-new'),
            descripcion_producto: "", 
            precio_unitario_venta_producto: formData.get('product-price-new'),
            categoria_producto_id: formData.get('product-category-new'),
            low_stock_threshold: 10,
            barcode: formData.get('product-sku-new'),
        };
        
        try {
            const newProduct = await apiClient('/api/stock/productos/', {
                method: 'POST',
                body: JSON.stringify(productData),
            });
            console.log('Success:', newProduct);
            setShowNewProductModal(false);
            fetchData(); // --> CAMBIO 4: Refrescamos la lista de productos automáticamente
        } catch (error) {
            console.error('Error al crear el producto:', error);
        }
    };

    const formatCurrency = (value) => `${value.toLocaleString('es-AR')}`;

    return (
        // ... TU CÓDIGO JSX SIGUE IGUAL AQUÍ ...
        // No es necesario cambiar nada en el return
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Catálogo de Productos</h1>
                <button onClick={() => setShowNewProductModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Agregar Nuevo Producto</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" id="product-search" className="flex-grow p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar producto..." />
                <select id="category-filter" className="p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option defaultValue>Todas las categorías</option>
                    {categories.map(category => (
                        <option key={category.id_categoria} value={category.id_categoria}>{category.nombre_categoria}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product, index) => (
                    <div key={product.id_producto || index} className="bg-pr-dark rounded-lg shadow-lg flex hover:ring-2 ring-pr-yellow transition-all duration-300">
                        <img className="w-1/3 object-cover rounded-l-lg" src={product.image || 'https://via.placeholder.com/150'} alt={product.nombre_producto} />
                        <div className="p-4 flex flex-col justify-between w-2/3">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-pr-gray mb-1">{product.categoria?.nombre_categoria || 'Sin categoría'}</p>
                                        <h3 className="text-lg font-bold text-white mb-2">{product.nombre_producto}</h3>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${product.status === 'En Stock' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{product.status || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pr-yellow mb-4">{formatCurrency(parseFloat(product.precio_unitario_venta_producto) || 0)}</p>
                                <div className="flex justify-end items-center gap-4">
                                    <button onClick={() => setShowEditProductModal(true)} className="text-sm text-pr-yellow hover:underline">Editar</button>
                                    <button className="text-red-500 hover:text-red-400"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ... Tu código de los modales (no necesita cambios) ... */}
            {showNewProductModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Crear Nuevo Producto</h3>
                                <button type="button" onClick={() => setShowNewProductModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleCreateProduct}>
                                    <div>
                                        <label htmlFor="dropzone-file" className="block mb-2 text-sm font-medium text-white">Imagen del Producto</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-pr-dark-gray border-gray-600 hover:bg-gray-800">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                                                </div>
                                                <input id="dropzone-file" type="file" className="hidden" />
                                            </label>
                                        </div> 
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="product-name-new" className="block mb-2 text-sm font-medium text-white">Nombre del Producto</label>
                                            <input type="text" name="product-name-new" id="product-name-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="product-sku-new" className="block mb-2 text-sm font-medium text-white">SKU / Código</label>
                                            <input type="text" name="product-sku-new" id="product-sku-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="product-category-new" className="block mb-2 text-sm font-medium text-white">Categoría</label>
                                            <select id="product-category-new" name="product-category-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                                {categories.map(category => (
                                                    <option key={category.id_categoria} value={category.id_categoria}>{category.nombre_categoria}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="product-supplier-new" className="block mb-2 text-sm font-medium text-white">Proveedor</label>
                                            <select id="product-supplier-new" name="product-supplier-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                                {suppliers.map(supplier => (
                                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><label htmlFor="product-cost-new" className="block mb-2 text-sm font-medium text-white">Costo</label><input type="number" name="product-cost-new" id="product-cost-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required /></div>
                                        <div><label htmlFor="product-price-new" className="block mb-2 text-sm font-medium text-white">Precio Venta</label><input type="number" name="product-price-new" id="product-price-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required /></div>
                                        <div><label htmlFor="product-initial-stock-new" className="block mb-2 text-sm font-medium text-white">Stock Inicial</label><input type="number" name="product-initial-stock-new" id="product-initial-stock-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="0" required /></div>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Crear Producto</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* El modal de edición tampoco necesita cambios */}
        </>
    );
};

export default JefeStock;
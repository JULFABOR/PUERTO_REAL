import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const JefeStock = () => {
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);

    // TODO: Fetch data from API
    const [products, setProducts] = useState([]);

    const formatCurrency = (value) => `$${value.toLocaleString('es-AR')}`;

    return (
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
                    <option selected>Todas las categorías</option>
                    <option value="tinto">Vino Tinto</option>
                    <option value="blanco">Vino Blanco</option>
                    <option value="espumante">Espumante</option>
                    <option value="destilado">Destilado</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product, index) => (
                    <div key={index} className="bg-pr-dark rounded-lg shadow-lg flex hover:ring-2 ring-pr-yellow transition-all duration-300">
                        <img className="w-1/3 object-cover rounded-l-lg" src={product.image} alt={product.name} />
                        <div className="p-4 flex flex-col justify-between w-2/3">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-pr-gray mb-1">{product.category}</p>
                                        <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${product.status === 'En Stock' ? 'bg-green-900 text-green-300' : product.status === 'Stock Bajo' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{product.status}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pr-yellow mb-4">{formatCurrency(product.price)}</p>
                                <div className="flex justify-end items-center gap-4">
                                    <button onClick={() => setShowEditProductModal(true)} className="text-sm text-pr-yellow hover:underline">Editar</button>
                                    <button className="text-red-500 hover:text-red-400"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                                <form className="space-y-4" action="#">
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
                                            <select id="product-category-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white"><option>Vino Tinto</option><option>Vino Blanco</option><option>Espumante</option><option>Destilado</option></select>
                                        </div>
                                        <div>
                                            <label htmlFor="product-supplier-new" className="block mb-2 text-sm font-medium text-white">Proveedor</label>
                                            <select id="product-supplier-new" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white"><option>Bodega El Roble</option><option>Importadora de Dest.</option><option>Distribuidora de Vinos</option></select>
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

            {showEditProductModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Editar Producto</h3>
                                <button type="button" onClick={() => setShowEditProductModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div>
                                        <label htmlFor="product-name-edit" className="block mb-2 text-sm font-medium text-white">Nombre del Producto</label>
                                        <input type="text" name="product-name-edit" id="product-name-edit" value="Malbec Reserva" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                    </div>
                                    <div>
                                        <label htmlFor="product-price-edit" className="block mb-2 text-sm font-medium text-white">Precio Venta</label>
                                        <input type="number" name="product-price-edit" id="product-price-edit" value="8500" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeStock;

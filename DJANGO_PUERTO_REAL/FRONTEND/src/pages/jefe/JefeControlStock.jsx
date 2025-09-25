import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faPlus } from '@fortawesome/free-solid-svg-icons';

const JefeControlStock = () => {
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showNewProductModal, setShowNewProductModal] = useState(false);

    // TODO: Fetch data from API
    const [products, setProducts] = useState([]);

    const formatCurrency = (value) => `$${value.toLocaleString('es-AR')}`;

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Inventario</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowAddStockModal(true)} className="w-full sm:w-auto text-white bg-pr-gray hover:bg-gray-600 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faPlusCircle} />
                        <span>Agregar Stock</span>
                    </button>
                    <button onClick={() => setShowNewProductModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Nuevo Producto</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Valor del Inventario</p><p className="text-3xl font-bold text-white">$0.00</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos Únicos</p><p className="text-3xl font-bold text-white">0</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Alertas Stock Bajo</p><p className="text-3xl font-bold text-red-500">0</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos sin Stock</p><p className="text-3xl font-bold text-white">0</p></div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input type="text" id="table-search" className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por producto o SKU..." />
                <select id="category-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option selected>Filtrar por Categoría</option>
                    <option value="tinto">Vino Tinto</option>
                    <option value="blanco">Vino Blanco</option>
                    <option value="destilado">Destilado</option>
                </select>
                <select id="status-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                    <option selected>Filtrar por Estado</option>
                    <option value="stock">En Stock</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                </select>
            </div>

            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Proveedor</th>
                            <th scope="col" className="px-6 py-3">Stock</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Costo</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Valor Stock</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={index} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{product.name}</th>
                                <td className="px-6 py-4 hidden sm:table-cell">{product.supplier}</td>
                                <td className={`px-6 py-4 font-bold ${product.status === 'Stock Bajo' ? 'text-red-500' : ''}`}>{product.stock}</td>
                                <td className="px-6 py-4 hidden md:table-cell">{formatCurrency(product.cost)}</td>
                                <td className="px-6 py-4 hidden lg:table-cell font-medium text-white">{formatCurrency(product.stockValue)}</td>
                                <td className="px-6 py-4"><span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${product.status === 'En Stock' ? 'bg-green-900 text-green-300' : product.status === 'Stock Bajo' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{product.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddStockModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Agregar Stock a Inventario</h3>
                                <button type="button" onClick={() => setShowAddStockModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div>
                                        <label htmlFor="stock-product-search" className="block mb-2 text-sm font-medium text-white">Buscar Producto</label>
                                        <input type="text" name="stock-product-search" id="stock-product-search" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por SKU o nombre..." required />
                                    </div>
                                    <div>
                                        <label htmlFor="stock-quantity" className="block mb-2 text-sm font-medium text-white">Cantidad a Agregar</label>
                                        <input type="number" name="stock-quantity" id="stock-quantity" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="0" required />
                                    </div>
                                    <div>
                                        <label htmlFor="stock-notes" className="block mb-2 text-sm font-medium text-white">Notas (Opcional)</label>
                                        <textarea id="stock-notes" rows="3" className="block p-2.5 w-full text-sm rounded-lg border bg-pr-dark-gray border-gray-600 placeholder-gray-400 text-white focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Ej: Factura Nº 1234 de Proveedor X"></textarea>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Confirmar Ingreso</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="product-name" className="block mb-2 text-sm font-medium text-white">Nombre del Producto</label>
                                            <input type="text" name="product-name" id="product-name" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="product-sku" className="block mb-2 text-sm font-medium text-white">SKU / Código</label>
                                            <input type="text" name="product-sku" id="product-sku" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="product-category" className="block mb-2 text-sm font-medium text-white">Categoría</label>
                                            <select id="product-category" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                                <option>Vino Tinto</option>
                                                <option>Vino Blanco</option>
                                                <option>Espumante</option>
                                                <option>Destilado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="product-supplier" className="block mb-2 text-sm font-medium text-white">Proveedor</label>
                                            <select id="product-supplier" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                                <option>Bodega El Roble</option>
                                                <option>Importadora de Dest.</option>
                                                <option>Distribuidora de Vinos</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="product-cost" className="block mb-2 text-sm font-medium text-white">Costo</label>
                                            <input type="number" name="product-cost" id="product-cost" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required />
                                        </div>
                                        <div>
                                            <label htmlFor="product-price" className="block mb-2 text-sm font-medium text-white">Precio Venta</label>
                                            <input type="number" name="product-price" id="product-price" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="$0.00" required />
                                        </div>
                                        <div>
                                            <label htmlFor="product-initial-stock" className="block mb-2 text-sm font-medium text-white">Stock Inicial</label>
                                            <input type="number" name="product-initial-stock" id="product-initial-stock" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" placeholder="0" required />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Crear Producto</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeControlStock;

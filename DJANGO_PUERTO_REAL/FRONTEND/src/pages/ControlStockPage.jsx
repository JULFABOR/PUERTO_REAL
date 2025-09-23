import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/Layout';

const ControlStockPage = () => {
    return (
        <>
            <Layout>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Inventario</h1>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button data-modal-target="add-stock-modal" data-modal-toggle="add-stock-modal" className="w-full sm:w-auto text-white bg-pr-gray hover:bg-gray-600 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faPlusCircle} />
                            <span>Agregar Stock</span>
                        </button>
                        <button data-modal-target="new-product-modal" data-modal-toggle="new-product-modal" className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Nuevo Producto</span>
                        </button>
                    </div>
                </div>
                
                {/* KPIs de Inventario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Valor del Inventario</p><p className="text-3xl font-bold text-white">$458,350.00</p></div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos Únicos</p><p className="text-3xl font-bold text-white">4</p></div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Alertas Stock Bajo</p><p className="text-3xl font-bold text-red-500">1</p></div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Productos sin Stock</p><p className="text-3xl font-bold text-white">0</p></div>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input type="text" id="table-search" className="w-full md:w-1/3 p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por producto o SKU..." />
                    <select id="category-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                        <option>Filtrar por Categoría</option>
                        <option value="tinto">Vino Tinto</option>
                        <option value="blanco">Vino Blanco</option>
                        <option value="destilado">Destilado</option>
                    </select>
                    <select id="status-filter" className="w-full md:w-auto p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow">
                        <option>Filtrar por Estado</option>
                        <option value="stock">En Stock</option>
                        <option value="low">Stock Bajo</option>
                        <option value="out">Sin Stock</option>
                    </select>
                </div>

                {/* Tabla de Inventario */}
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
                            <tr className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <td className="px-6 py-4 font-mono text-xs">VT-MAL-001</td>
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">Malbec Reserva</th>
                                <td className="px-6 py-4 hidden sm:table-cell">Bodega El Roble</td>
                                <td className="px-6 py-4 font-bold">48</td>
                                <td className="px-6 py-4 hidden md:table-cell">$5,100.00</td>
                                <td className="px-6 py-4 hidden lg:table-cell font-medium text-white">$244,800.00</td>
                                <td className="px-6 py-4"><span className="bg-green-900 text-green-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded">En Stock</span></td>
                            </tr>
                            <tr className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <td className="px-6 py-4 font-mono text-xs">DE-WHI-005</td>
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">Whisky Single Malt</th>
                                <td className="px-6 py-4 hidden sm:table-cell">Importadora de Dest.</td>
                                <td className="px-6 py-4 font-bold text-red-500">5</td>
                                <td className="px-6 py-4 hidden md:table-cell">$18,750.00</td>
                                <td className="px-6 py-4 hidden lg:table-cell font-medium text-white">$93,750.00</td>
                                <td className="px-6 py-4"><span className="bg-red-900 text-red-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded">Stock Bajo</span></td>
                            </tr>
                            {/* ... más filas ... */}
                        </tbody>
                    </table>
                </div>
            </Layout>

            {/* Modals */}
            <div id="add-stock-modal" tabIndex="-1" aria-hidden="true" className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                {/* ... contenido del modal de agregar stock ... */}
            </div> 

            <div id="new-product-modal" tabIndex="-1" aria-hidden="true" className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                {/* ... contenido del modal de nuevo producto ... */}
            </div>
        </>
    );
};

export default ControlStockPage;

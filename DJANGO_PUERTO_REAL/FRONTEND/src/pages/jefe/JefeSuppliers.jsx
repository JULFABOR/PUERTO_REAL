import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const JefeSuppliers = () => {
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);

    // TODO: Fetch data from API
    const [suppliers, setSuppliers] = useState([]);

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Proveedores</h1>
                <button onClick={() => setShowNewSupplierModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Nuevo Proveedor</span>
                </button>
            </div>

            <div className="mb-4">
                <input type="text" id="table-search" className="w-full p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por nombre, contacto o CUIT..." />
            </div>

            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre Proveedor</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Contacto</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Email</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Teléfono</th>
                            <th scope="col" className="px-6 py-3 hidden xl:table-cell">Último Pedido</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((supplier, index) => (
                            <tr key={index} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{supplier.name}</th>
                                <td className="px-6 py-4 hidden sm:table-cell">{supplier.contact}</td>
                                <td className="px-6 py-4 hidden md:table-cell">{supplier.email}</td>
                                <td className="px-6 py-4 hidden lg:table-cell">{supplier.phone}</td>
                                <td className="px-6 py-4 hidden xl:table-cell">{supplier.lastOrder}</td>
                                <td className="px-6 py-4 flex items-center gap-4"><a href="#" className="font-medium text-pr-yellow hover:underline">Ver</a><button onClick={() => setShowEditSupplierModal(true)} className="font-medium text-blue-500 hover:underline">Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showNewSupplierModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Registrar Nuevo Proveedor</h3>
                                <button type="button" onClick={() => setShowNewSupplierModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div> 
                                            <label htmlFor="supplier-name" className="block mb-2 text-sm font-medium text-white">Nombre de la Empresa</label>
                                            <input type="text" name="supplier-name" id="supplier-name" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="supplier-contact" className="block mb-2 text-sm font-medium text-white">Nombre de Contacto</label>
                                            <input type="text" name="supplier-contact" id="supplier-contact" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="supplier-phone" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="supplier-phone" id="supplier-phone" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="supplier-email" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="supplier-email" id="supplier-email" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="supplier-cuit" className="block mb-2 text-sm font-medium text-white">CUIT</label>
                                        <input type="text" name="supplier-cuit" id="supplier-cuit" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Proveedor</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditSupplierModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Editar Proveedor</h3>
                                <button type="button" onClick={() => setShowEditSupplierModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div> 
                                            <label htmlFor="supplier-name-edit" className="block mb-2 text-sm font-medium text-white">Nombre de la Empresa</label>
                                            <input type="text" name="supplier-name-edit" id="supplier-name-edit" value="Distribuidora de Vinos S.A." className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="supplier-contact-edit" className="block mb-2 text-sm font-medium text-white">Nombre de Contacto</label>
                                            <input type="text" name="supplier-contact-edit" id="supplier-contact-edit" value="Marcos López" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="supplier-phone-edit" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="supplier-phone-edit" id="supplier-phone-edit" value="11-5555-1234" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="supplier-email-edit" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="supplier-email-edit" id="supplier-email-edit" value="compras@distrivinos.com" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="supplier-cuit-edit" className="block mb-2 text-sm font-medium text-white">CUIT</label>
                                        <input type="text" name="supplier-cuit-edit" id="supplier-cuit-edit" value="30-12345678-9" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
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

export default JefeSuppliers;

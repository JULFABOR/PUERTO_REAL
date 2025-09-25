import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faStar, faPercent, faWineBottle, faGift } from '@fortawesome/free-solid-svg-icons';

const JefeCustomers = () => {
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [showConditionsModal, setShowConditionsModal] = useState(false);

    // TODO: Fetch data from API
    const [customers, setCustomers] = useState([]);

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Clientes</h1>
                <button onClick={() => setShowNewClientModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Total de Clientes</p><p className="text-3xl font-bold text-white">0</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Nuevos (Este Mes)</p><p className="text-3xl font-bold text-green-500">0</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Cliente con Más Puntos</p><p className="text-xl font-bold text-white truncate">-</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Total Puntos Canjeados</p><p className="text-3xl font-bold text-white">0</p></div>
            </div>

            <div className="mb-4">
                <input type="text" id="table-search" className="w-full p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por nombre, email o teléfono..." />
            </div>

            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre Cliente</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Email</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Teléfono</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Puntaje</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer, index) => (
                            <tr key={index} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{customer.name}</th>
                                <td className="px-6 py-4 hidden sm:table-cell">{customer.email}</td>
                                <td className="px-6 py-4 hidden md:table-cell">{customer.phone}</td>
                                <td className="px-6 py-4 hidden lg:table-cell"><div className="flex items-center gap-1 text-pr-yellow"><FontAwesomeIcon icon={faStar} /><span>{customer.points}</span></div></td>
                                <td className="px-6 py-4 flex items-center gap-4"><a href="#" className="font-medium text-pr-yellow hover:underline">Ver</a><button onClick={() => setShowEditClientModal(true)} className="font-medium text-blue-500 hover:underline">Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Promociones por Puntos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faPercent} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">10% de Descuento</h3>
                            <p className="text-pr-gray mb-4">En tu próxima compra de vinos seleccionados.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">500 Puntos</div>
                            <button onClick={() => setShowConditionsModal(true)} className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faWineBottle} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Botella Gratis</h3>
                            <p className="text-pr-gray mb-4">Lleva una botella de nuestro Malbec Clásico sin cargo.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">1500 Puntos</div>
                            <button onClick={() => setShowConditionsModal(true)} className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faGift} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Cata Exclusiva</h3>
                            <p className="text-pr-gray mb-4">Acceso para dos personas a nuestra próxima cata de vinos premium.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">3000 Puntos</div>
                            <button onClick={() => setShowConditionsModal(true)} className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
                </div>
            </div>

            {showNewClientModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Registrar Nuevo Cliente</h3>
                                <button type="button" onClick={() => setShowNewClientModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="client-name" className="block mb-2 text-sm font-medium text-white">Nombre y Apellido</label>
                                            <input type="text" name="client-name" id="client-name" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="client-email" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="client-email" id="client-email" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="client-phone" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="client-phone" id="client-phone" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="client-dni" className="block mb-2 text-sm font-medium text-white">DNI / CUIT</label>
                                            <input type="text" name="client-dni" id="client-dni" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="client-address" className="block mb-2 text-sm font-medium text-white">Dirección</label>
                                        <input type="text" name="client-address" id="client-address" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cliente</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditClientModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Editar Cliente</h3>
                                <button type="button" onClick={() => setShowEditClientModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" action="#">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="client-name-edit" className="block mb-2 text-sm font-medium text-white">Nombre y Apellido</label>
                                            <input type="text" name="client-name-edit" id="client-name-edit" value="Juan Pérez" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="client-email-edit" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="client-email-edit" id="client-email-edit" value="juan.perez@email.com" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="client-phone-edit" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="client-phone-edit" id="client-phone-edit" value="11-2345-6789" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="client-dni-edit" className="block mb-2 text-sm font-medium text-white">DNI / CUIT</label>
                                            <input type="text" name="client-dni-edit" id="client-dni-edit" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="client-address-edit" className="block mb-2 text-sm font-medium text-white">Dirección</label>
                                        <input type="text" name="client-address-edit" id="client-address-edit" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConditionsModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Términos y Condiciones</h3>
                                <button type="button" onClick={() => setShowConditionsModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5 space-y-4">
                                <h4 className="text-lg font-bold text-pr-yellow">Promo: 10% de Descuento</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-2">
                                    <li>Válido únicamente para la próxima compra.</li>
                                    <li>Aplica solo a vinos de la categoría "Selección Especial".</li>
                                    <li>No acumulable con otras promociones.</li>
                                    <li>El descuento se aplica sobre el precio de lista.</li>
                                    <li>Promoción válida hasta el 31/12/2025.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeCustomers;

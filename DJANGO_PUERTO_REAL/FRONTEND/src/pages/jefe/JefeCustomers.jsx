import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus, faStar, faPercent, faWineBottle, faGift, // Icons for promotions
    faSearch, faSpinner, faExclamationTriangle, faInbox, // Icons for states & search
    faPen, faTrash // Icons for actions
} from '@fortawesome/free-solid-svg-icons';

// --- Modales ---
// (Ya los refactorizamos en la sección de Empleado, así que funcionarán)
import NewClientModal from '@/components/Modals/Clientes/NewClientModal';
import EditClientModal from '@/components/Modals/Clientes/EditClientModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
// import ConditionsModal from '../../../components/Modals/ConditionsModal';

const JefeCustomers = () => {
    // --- ESTADOS (Sin cambios) ---
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [showConditionsModal, setShowConditionsModal] = useState(false); 


    // --- CAMBIO 1: fetchClients con Axios ---
    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Antes: const data = await apiClient('/api/fidelizacion/clientes/');
            // Ahora:
            const response = await apiClient.get('/fidelizacion/clientes/');
            const data = response.data; // Los datos están en response.data
            
            setClients(data.results || data || []);
        } catch (err) {
            // Mejoramos el manejo de error de Axios
            const errorMsg = err.response?.data?.detail || err.message || 'Error desconocido al cargar clientes.';
            setError(errorMsg);
            toast.error("No se pudieron cargar los clientes.");
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // --- FILTRADO Y ESTADÍSTICAS (Sin cambios) ---
    const filteredClients = useMemo(() => {
        const search = searchTerm.toLowerCase();
        if (!search) return clients;
        return clients.filter(client =>
            (client.user_first_name?.toLowerCase().includes(search)) ||
            (client.user_last_name?.toLowerCase().includes(search)) ||
            (client.user_email?.toLowerCase().includes(search)) ||
            (client.dni_cliente?.toLowerCase().includes(search)) ||
            (client.telefono_cliente?.includes(search))
        );
    }, [clients, searchTerm]);

    const stats = useMemo(() => {
        const totalClients = clients.length;
        const newThisMonth = 0; // Placeholder
        const topClient = clients.reduce((max, client) => (client.puntos || 0) > (max.puntos || 0) ? client : max, { puntos: -1 });
        const totalPointsRedeemed = 0; // Placeholder

        return {
            totalClients,
            newThisMonth,
            topClientName: totalClients > 0 && topClient.puntos > -1 ? `${topClient.user_first_name || ''} ${topClient.user_last_name || ''} (${topClient.puntos} pts)` : '-',
            totalPointsRedeemed
        };
    }, [clients]);


    // --- MANEJO DE MODALES Y ACCIONES ---
    const handleSuccess = () => {
        fetchClients();
        setShowNewClientModal(false);
        setShowEditModal(false);
    };

    const handleEditClick = (client) => {
        setClientToEdit(client);
        setShowEditModal(true);
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    // --- CAMBIO 2: handleConfirmDelete con Axios ---
    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        const loadingToast = toast.loading('Eliminando cliente...');
        try {
            // Antes: await apiClient(url, { method: 'DELETE' });
            // Ahora:
            await apiClient.delete(`/fidelizacion/clientes/${clientToDelete.id_cliente}/`);
            
            toast.success('Cliente eliminado con éxito', { id: loadingToast });
            setClientToDelete(null);
            setShowDeleteModal(false);
            fetchClients();
        } catch (err) {
            // Antes: toast.error(err.data?.detail ...)
            // Ahora:
            const errorMsg = err.response?.data?.detail || 'No se pudo eliminar el cliente.';
            toast.error(errorMsg, { id: loadingToast });
        }
    };

    // --- RENDERIZADO (Sin cambios) ---
    if (loading && clients.length === 0) {
        return (
             <div className="flex justify-center items-center h-64 text-pr-yellow">
                 <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
             </div>
        );
    }

    if (error) {
       return (
           <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
               <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
               <div>
                   <strong className="font-bold">Error al cargar datos:</strong>
                   <span className="block sm:inline ml-2">{error}</span>
               </div>
           </div>
       );
    }


    return (
        <>
            {/* --- CABECERA Y BOTÓN NUEVO --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Clientes</h1>
                <button
                    onClick={() => setShowNewClientModal(true)}
                    className="btn-primary w-full sm:w-auto"
                >
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* --- TARJETAS DE ESTADÍSTICAS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Total de Clientes</p>
                    <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Nuevos (Este Mes)</p>
                    <p className="text-3xl font-bold text-green-500">{stats.newThisMonth}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Cliente con Más Puntos</p>
                    <p className="text-lg font-bold text-white truncate pt-2">{stats.topClientName}</p>
                </div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                    <p className="text-sm text-pr-gray">Total Puntos Canjeados</p>
                    <p className="text-3xl font-bold text-white">{stats.totalPointsRedeemed}</p>
                </div>
            </div>

            {/* --- BÚSQUEDA --- */}
            <div className="relative mb-6">
                <input
                    type="text"
                    id="table-search"
                    className="w-full p-3 pl-10 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow"
                    placeholder="Buscar por nombre, email, DNI o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                 />
            </div>

            {/* --- TABLA DE CLIENTES --- */}
            <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                         <tr>
                            <th scope="col" className="px-6 py-3">Nombre Cliente</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Email</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Teléfono</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Puntaje</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.id_cliente} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        {client.user_first_name || ''} {client.user_last_name || ''}
                                    </th>
                                    <td className="px-6 py-4 hidden sm:table-cell">{client.user_email || '-'}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{client.telefono_cliente || '-'}</td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <div className="flex items-center gap-1 text-pr-yellow">
                                            <FontAwesomeIcon icon={faStar} />
                                            <span>{client.puntos || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(client)}
                                                className="text-sm text-pr-yellow border border-pr-yellow rounded-md px-3 py-1.5 font-semibold hover:bg-pr-yellow hover:text-pr-dark transition-colors flex items-center justify-center aspect-square"
                                                title="Editar cliente"
                                            >
                                                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(client)}
                                                className="text-sm text-red-500 border border-red-500 rounded-md px-3 py-1.5 font-semibold hover:bg-red-500 hover:text-pr-dark transition-colors flex items-center justify-center aspect-square"
                                                title="Eliminar cliente"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan="5" className="text-center p-12 text-pr-gray">
                                    <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                                    <p className="font-bold text-white text-lg">
                                        {searchTerm ? 'No se encontraron clientes con ese término.' : 'No hay clientes registrados.'}
                                    </p>
                                    {!searchTerm && <p className="text-sm">Puedes añadir uno usando el botón "Nuevo Cliente".</p>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- SECCIÓN PROMOCIONES --- */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Promociones por Puntos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Tarjeta 10% Descuento */}
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
                    {/* Tarjeta Botella Gratis */}
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
                    {/* Tarjeta Cata Exclusiva */}
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

            {/* --- RENDERIZADO DE MODALES --- */}
            <NewClientModal
                isOpen={showNewClientModal}
                onClose={() => setShowNewClientModal(false)}
                onSuccess={handleSuccess}
            />
            <EditClientModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleSuccess}
                client={clientToEdit}
            />
            <ConfirmDeleteModal
                isOpen={!!clientToDelete}
                onClose={() => setClientToDelete(null)}
                onConfirm={handleConfirmDelete}
                itemName={`${clientToDelete?.user_first_name || ''} ${clientToDelete?.user_last_name || ''}`}
                itemType="cliente"
            />

            {/* Modal de Condiciones (Ejemplo simple) */}
            {showConditionsModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Términos y Condiciones</h3>
                                <button type="button" onClick={() => setShowConditionsModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 md:p-5 space-y-4 text-gray-300">
                                <p>Aquí irían los términos y condiciones detallados para cada promoción...</p>
                                <p><strong>Ejemplo (10% Descuento):</strong> Válido solo en vinos seleccionados, no acumulable, etc.</p>
                            </div>
                            <div className="flex items-center justify-end p-4 border-t border-gray-600">
                                <button onClick={() => setShowConditionsModal(false)} className="bg-pr-gray text-pr-dark font-bold py-2 px-4 rounded-lg">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeCustomers;
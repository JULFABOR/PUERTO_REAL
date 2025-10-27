import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast'; // <-- ADD: Necesario para los toasts de borrado
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faPlus, 
    faUsersSlash,
    faSpinner,
    faExclamationTriangle,
    faPen,  // <-- ADD: Icono de editar
    faTrash // <-- ADD: Icono de borrar
} from '@fortawesome/free-solid-svg-icons';

// --- Modales ---
import NewClientModal from '../../../components/Modals/NewClientModal';
import EditClientModal from '../../../components/Modals/EditClientModal'; // <-- ADD: Modal de edición
import ConfirmDeleteModal from '../../../components/Modals/ConfirmDeleteModal'; // <-- ADD: Modal de borrado (reutilizado)


// (Función helper para iniciales)
const getInitials = (client) => {
    // --- FIX: Usar los nuevos campos del serializer ---
    const firstName = client.user_first_name || '';
    const lastName = client.user_last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Clientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para modales
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    
    // --- ADD: Estados para editar y borrar ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // (fetchClients - sin cambios)
    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient('/api/fidelizacion/clientes/');
            setClients(data.results || data); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // (useEffect para carga inicial - sin cambios)
    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // (filteredClients)
    const filteredClients = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return clients.filter(client =>
            // --- FIX: Usar los nuevos campos del serializer ---
            (client.user_first_name?.toLowerCase().includes(search)) ||
            (client.user_last_name?.toLowerCase().includes(search)) ||
            (client.user_email?.toLowerCase().includes(search)) ||
            (client.dni_cliente?.toLowerCase().includes(search))
        );
    }, [clients, searchTerm]);
    
    // (handleAddClient - sin cambios)
    const handleAddClient = () => {
        setShowNewClientModal(true);
    };

    // (handleModalSuccess - renombrado y mejorado)
    const handleSuccess = () => {
        fetchClients(); // Refresca la lista
        setShowNewClientModal(false);
        setShowEditModal(false);
    };

    // --- ADD: Handlers para Editar ---
    const handleEditClick = (client) => {
        setClientToEdit(client);
        setShowEditModal(true);
    };

    // --- ADD: Handlers para Borrar ---
    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        
        const loadingToast = toast.loading('Eliminando cliente...');
        try {
            await apiClient(`/api/fidelizacion/clientes/${clientToDelete.id_cliente}/`, { 
                method: 'DELETE' 
            });
            toast.success('Cliente eliminado con éxito', { id: loadingToast });
            setClientToDelete(null);
            setShowDeleteModal(false);
            fetchClients(); // Refrescar la lista
        } catch (err) {
            toast.error('No se pudo eliminar el cliente.', { id: loadingToast });
        }
    };


    // (Estados de Carga y Error - sin cambios)
    if (loading) { /* ... */ }
    if (error) { /* ... */ }

    return (
        <div>
            {/* (Barra de Búsqueda y Botón - sin cambios) */}
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Clientes</h1>
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, DNI o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
                <button 
                    onClick={handleAddClient}
                    className="bg-pr-yellow text-pr-dark font-bold py-3 px-5 rounded-lg hover:bg-opacity-80 transition-colors flex items-center shrink-0 ml-4"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Cliente
                </button>
            </div>

            {/* (Cuadrícula de Clientes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div key={client.id_cliente} className="bg-pr-dark rounded-lg shadow-lg border border-gray-700 p-6 flex flex-col justify-between transition-all hover:shadow-pr-yellow/20">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-pr-yellow rounded-full flex items-center justify-center text-pr-dark font-bold text-xl shrink-0">
                                        {getInitials(client)}
                                    </div>
                                    <div>
                                        {/* --- FIX: Usar los nuevos campos del serializer --- */}
                                        <h3 className="font-bold text-lg text-white">
                                            {client.user_first_name} {client.user_last_name}
                                        </h3>
                                        <p className="text-sm text-gray-400">{client.user_email || 'Sin email'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p><strong>DNI:</strong> {client.dni_cliente || 'No provisto'}</p>
                                    <p><strong>Tel:</strong> {client.telefono_cliente || 'No provisto'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                                <div>
                                    <span className="text-3xl font-bold text-pr-yellow">{client.puntos || 0}</span>
                                    <span className="ml-2 text-gray-400">puntos</span>
                                </div>
                                
                                {/* --- ADD: Botones de Editar y Borrar --- */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEditClick(client)}
                                        className="text-sm text-pr-yellow border border-pr-yellow rounded-md px-4 py-1.5 font-semibold hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faPen} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(client)}
                                        className="text-sm text-red-500 border border-red-500 rounded-md px-4 py-1.5 font-semibold hover:bg-red-500 hover:text-pr-dark transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-10 bg-pr-dark rounded-lg border border-gray-700 col-span-full">
                        <FontAwesomeIcon icon={faUsersSlash} size="3x" className="mb-4 text-gray-600" />
                        <h3 className="text-xl font-bold text-white">No se encontraron clientes</h3>
                        <p>Intenta ajustar tu búsqueda o crea un nuevo cliente.</p>
                    </div>
                )}
            </div>

            {/* --- Modales --- */}
            <NewClientModal
                isOpen={showNewClientModal}
                onClose={() => setShowNewClientModal(false)}
                onSuccess={handleSuccess}
            />

            {/* --- ADD: Renderizar nuevos modales --- */}
            <EditClientModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleSuccess}
                client={clientToEdit}
            />

            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                itemName={clientToDelete?.user_first_name} // <-- FIX: Usar el campo correcto
                itemType="cliente"
            />
        </div>
    );
};

export default Clientes;
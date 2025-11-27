import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/api/apiClient'; // <-- Nuestra instancia de Axios
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faPlus, 
    faUsersSlash,
    faSpinner,
    faExclamationTriangle,
    faPen, 
    faTrash 
} from '@fortawesome/free-solid-svg-icons';

// --- Modales ---
import NewClientModal from '@/components/Modals/Clientes/NewClientModal';
import EditClientModal from '@/components/Modals/Clientes/EditClientModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal'; 


const getInitials = (client) => {
    const firstName = client.user_first_name || '';
    const lastName = client.user_last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Clientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // --- CAMBIO 1: fetchClients con sintaxis Axios ---
    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            // Antes: const data = await apiClient('/api/fidelizacion/clientes/');
            // Ahora:
            const response = await apiClient.get('/fidelizacion/clientes/');
            const data = response.data; // Los datos están en response.data
            
            setClients(data.results || data); 
        
        } catch (err) {
            // Mejoramos el mensaje de error
            const errorMsg = err.response?.data?.detail || err.message;
            setError(errorMsg);
            toast.error(`Error al cargar clientes: ${errorMsg}`);
        
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // (filteredClients - sin cambios)
    const filteredClients = useMemo(() => {
        // ... (tu lógica de filtro es correcta)
        const search = searchTerm.toLowerCase();
        return clients.filter(client =>
            (client.user_first_name?.toLowerCase().includes(search)) ||
            (client.user_last_name?.toLowerCase().includes(search)) ||
            (client.user_email?.toLowerCase().includes(search)) ||
            (client.dni_cliente?.toLowerCase().includes(search))
        );
    }, [clients, searchTerm]);
    
    // (Handlers de modales - sin cambios)
    const handleAddClient = () => setShowNewClientModal(true);
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

    // --- CAMBIO 2: handleConfirmDelete con sintaxis Axios ---
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
            fetchClients(); // Refrescar la lista
        
        } catch (err) {
            // Mejoramos el error
            const errorMsg = err.response?.data?.detail || 'No se pudo eliminar el cliente.';
            toast.error(errorMsg, { id: loadingToast });
        }
    };


    // (Render - sin cambios)
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-pr-yellow">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center text-red-400 p-10 bg-pr-dark rounded-lg border border-red-900">
                <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4" />
                <h3 className="text-xl font-bold">Error al cargar datos</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            {/* ... (Todo tu JSX de renderizado estaba perfecto) ... */}
            
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Clientes</h1>
            <div className="flex justify-between items-center mb-6">
                {/* ... (Barra de búsqueda y botón) ... */}
                <div className="relative w-full md:w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, DNI o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button 
                    onClick={handleAddClient}
                    className="bg-pr-yellow text-pr-dark font-bold py-3 px-5 rounded-lg hover:bg-opacity-80 transition-colors flex items-center shrink-0 ml-4"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Cliente
                </button>
            </div>

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
                                        <h3 className="font-bold text-lg text-white">
                                            {client.user_first_name} {client.user_last_name}
                                        </h3>
                                        <p className="text-sm text-gray-300">{client.user_email || 'Sin email'}</p>
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
                                    <span className="ml-2 text-gray-300">puntos</span>
                                </div>
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
                    <div className="text-center text-gray-300 py-10 bg-pr-dark rounded-lg border border-gray-700 col-span-full">
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
                itemName={clientToDelete?.user_first_name}
                itemType="cliente"
            />
        </div>
    );
};

export default Clientes;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faSearch,
    faSpinner,
    faExclamationTriangle,
    faInbox,
    faPen,
    faTrash,
    faUsers,
    faDollarSign,
    faCrown,
    faCalculator,
    faArrowUp,
    faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import NewClientModal from '@/components/Modals/Clientes/NewClientModal';
import EditClientModal from '@/components/Modals/Clientes/EditClientModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';

// --- Componente de Cabecera de Tabla Ordenable ---
const SortableHeader = ({ children, name, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === name;
    const directionIcon = sortConfig.direction === 'ascending' ? faArrowUp : faArrowDown;

    return (
        <th scope="col" className="px-6 py-3 cursor-pointer select-none" onClick={() => onSort(name)}>
            {children}
            {isSorted && <FontAwesomeIcon icon={directionIcon} className="ml-2 text-pr-yellow" />}
        </th>
    );
};

// --- Helpers de Formato ---
const formatCurrency = (value) => `${parseFloat(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
};


const JefeCustomers = () => {
    // --- ESTADOS ---
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'gasto_total', direction: 'descending' });

    // Estados de Modales
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // --- LÓGICA DE DATOS ---
    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/fidelizacion/clientes/');
            setClients(response.data.results || response.data || []);
        } catch (err) {
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

    // --- CÁLCULOS Y MEMOIZACIÓN ---
    const filteredClients = useMemo(() => {
        const search = searchTerm.toLowerCase();
        if (!search) return clients;
        return clients.filter(client =>
            (client.user_first_name?.toLowerCase().includes(search)) ||
            (client.user_last_name?.toLowerCase().includes(search)) ||
            (client.user_email?.toLowerCase().includes(search)) ||
            (client.dni_cliente?.toLowerCase().includes(search))
        );
    }, [clients, searchTerm]);

    const sortedClients = useMemo(() => {
        let sortableItems = [...filteredClients];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredClients, sortConfig]);

    const stats = useMemo(() => {
        const totalClients = clients.length;
        if (totalClients === 0) {
            return { totalClients: 0, totalRevenue: 0, bestClient: 'N/A', avgRevenue: 0 };
        }
        const totalRevenue = clients.reduce((sum, client) => sum + parseFloat(client.gasto_total || 0), 0);
        const bestClient = clients.reduce((max, client) => (parseFloat(client.gasto_total || 0) > parseFloat(max.gasto_total || 0) ? client : max), clients[0]);
        const avgRevenue = totalRevenue / totalClients;

        return {
            totalClients,
            totalRevenue,
            bestClient: `${bestClient.user_first_name} ${bestClient.user_last_name}`,
            avgRevenue,
        };
    }, [clients]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            // Opcional: un tercer click podría quitar el ordenamiento
            // key = null;
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    // --- MANEJO DE MODALES ---
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

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        const loadingToast = toast.loading('Eliminando cliente...');
        try {
            await apiClient.delete(`/fidelizacion/clientes/${clientToDelete.id_cliente}/`);
            toast.success('Cliente eliminado con éxito', { id: loadingToast });
            setClientToDelete(null);
            setShowDeleteModal(false);
            fetchClients();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'No se pudo eliminar el cliente.';
            toast.error(errorMsg, { id: loadingToast });
        }
    };
    
    // --- RENDERIZADO ---
    if (loading && clients.length === 0) {
        return <div className="flex justify-center items-center h-64 text-pr-yellow"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" /></div>;
    }

    if (error) {
       return <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center" role="alert"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-3" /><span><strong>Error:</strong> {error}</span></div>;
    }

    return (
        <>
            <div className="bg-pr-dark-gray p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Panel Estratégico de Clientes</h2>

                {/* --- TARJETAS DE ESTADÍSTICAS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-pr-yellow">
                        <FontAwesomeIcon icon={faUsers} className="text-2xl text-pr-yellow mb-3" />
                        <p className="text-sm text-gray-400">Total de Clientes</p>
                        <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-green-500">
                        <FontAwesomeIcon icon={faDollarSign} className="text-2xl text-green-500 mb-3" />
                        <p className="text-sm text-gray-400">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
                        <FontAwesomeIcon icon={faCalculator} className="text-2xl text-blue-500 mb-3" />
                        <p className="text-sm text-gray-400">Gasto Promedio / Cliente</p>
                        <p className="text-3xl font-bold text-white">{formatCurrency(stats.avgRevenue)}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
                        <FontAwesomeIcon icon={faCrown} className="text-2xl text-purple-500 mb-3" />
                        <p className="text-sm text-gray-400">Mejor Cliente</p>
                        <p className="text-xl font-bold text-white truncate pt-2">{stats.bestClient}</p>
                    </div>
                </div>

                {/* --- PANEL DE CONTROL --- */}
                <div className="bg-pr-dark p-4 rounded-lg mb-6 border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-grow w-full">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            className="w-full p-2 pl-10 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-pr-yellow focus:border-pr-yellow"
                            placeholder="Buscar por nombre, email o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowNewClientModal(true)} className="btn-primary w-full md:w-auto shrink-0">
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                        Nuevo Cliente
                    </button>
                </div>


                {/* --- TABLA DE CLIENTES --- */}
                <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                            <tr>
                                <SortableHeader name="user_first_name" sortConfig={sortConfig} onSort={handleSort}>Cliente</SortableHeader>
                                <SortableHeader name="gasto_total" sortConfig={sortConfig} onSort={handleSort}>Gasto Total</SortableHeader>
                                <SortableHeader name="numero_de_compras" sortConfig={sortConfig} onSort={handleSort}>Nº Compras</SortableHeader>
                                <SortableHeader name="ultima_compra" sortConfig={sortConfig} onSort={handleSort}>Última Compra</SortableHeader>
                                <SortableHeader name="puntos" sortConfig={sortConfig} onSort={handleSort}>Puntos</SortableHeader>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClients.length > 0 ? (
                                sortedClients.map((client) => (
                                    <tr key={client.id_cliente} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800 transition-colors">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span>{client.user_first_name || ''} {client.user_last_name || ''}</span>
                                                <span className="text-xs text-gray-500">{client.user_email}</span>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 font-mono text-lg">{formatCurrency(client.gasto_total)}</td>
                                        <td className="px-6 py-4 text-center">{client.numero_de_compras}</td>
                                        <td className="px-6 py-4">{formatDate(client.ultima_compra)}</td>
                                        <td className="px-6 py-4 text-pr-yellow font-bold">{client.puntos || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditClick(client)} className="btn-icon-edit" title="Editar cliente"><FontAwesomeIcon icon={faPen} /></button>
                                                <button onClick={() => handleDeleteClick(client)} className="btn-icon-delete" title="Eliminar cliente"><FontAwesomeIcon icon={faTrash} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-12 text-gray-500">
                                        <FontAwesomeIcon icon={faInbox} className="text-4xl text-gray-600 mb-4" />
                                        <p className="font-bold text-white text-lg">
                                            {searchTerm ? 'No se encontraron clientes con ese término.' : 'No hay clientes registrados.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALES --- */}
            <NewClientModal isOpen={showNewClientModal} onClose={() => setShowNewClientModal(false)} onSuccess={handleSuccess} />
            <EditClientModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSuccess={handleSuccess} client={clientToEdit} />
            <ConfirmDeleteModal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} onConfirm={handleConfirmDelete} itemName={`${clientToDelete?.user_first_name || ''} ${clientToDelete?.user_last_name || ''}`} itemType="cliente" />
        </>
    );
};

export default JefeCustomers;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faSearch,
    faSpinner,
    faExclamationTriangle,
    faInbox,
    faEdit,
    faTrash,
    faSort,
    faSortUp,
    faSortDown,
    faCircle, // Needed for StatusBadge
    faFileInvoiceDollar, // Icon for Orders button
    faCheck              // Icon for Mark as Received button
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Ensure path is correct
import useDebounce from '../../hooks/useDebounce'; // Ensure path is correct

// --- Modals --- (Ensure paths are correct)
import NewProviderModal from '../../components/Modals/NewProviderModal';
import EditProviderModal from '../../components/Modals/EditProviderModal';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';
import NewOrdenCompraModal from '../../components/Modals/NewOrdenCompraModal'; // <-- Modal for new order

// --- HELPER COMPONENT: SORT INDICATOR ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- HELPER COMPONENT: STATUS BADGE ---
const StatusBadge = ({ estado }) => {
    // Expects 'estado' object like { id_estado: X, nombre_estado: 'Y' }
    const nombreEstado = estado?.nombre_estado?.toLowerCase() || '';
    let bgColor = 'bg-gray-700'; // Default/Unknown state
    let textColor = 'text-gray-300';

    if (nombreEstado === 'activo' || nombreEstado === 'recibida') { // Treat 'Recibida' as green
        bgColor = 'bg-green-600/20';
        textColor = 'text-green-300';
    } else if (nombreEstado === 'pendiente') { // Yellow for pending
        bgColor = 'bg-yellow-600/20';
        textColor = 'text-yellow-300';
    } else if (nombreEstado === 'inactivo' || nombreEstado === 'cancelada') { // Red for inactive/cancelled
        bgColor = 'bg-red-600/20';
        textColor = 'text-red-300';
    }
    // Add more 'else if' for other states if needed

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} whitespace-nowrap`}
        >
            <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-1.5" />
            {estado?.nombre_estado || 'Desconocido'}
        </span>
    );
};


const JefeSuppliers = () => {
    // --- STATE MANAGEMENT ---
    const [viewMode, setViewMode] = useState('suppliers'); // 'suppliers' or 'orders'

    // Supplier States
    const [providers, setProviders] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [supplierError, setSupplierError] = useState(null);
    const [searchTermSuppliers, setSearchTermSuppliers] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_proveedor', direction: 'ascending' });
    const [supplierStates, setSupplierStates] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showNewProviderModal, setShowNewProviderModal] = useState(false);
    const [showEditProviderModal, setShowEditProviderModal] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [providerToDelete, setProviderToDelete] = useState(null);

    // Order States
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderError, setOrderError] = useState(null);
    const [searchTermOrders, setSearchTermOrders] = useState('');
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const debouncedSearchTermOrders = useDebounce(searchTermOrders, 300);

    // --- DATA FETCHING ---
    const fetchSuppliersAndStates = useCallback(async () => {
        setLoadingSuppliers(true); // Siempre poner loading al iniciar
        setSupplierError(null);
        try {
            const [suppliersData, statesData] = await Promise.all([
                apiClient('/api/compras/proveedores/'),
                apiClient('/api/compras/estados-proveedor/')
            ]);
            setProviders(suppliersData || []);
            setSupplierStates(statesData || []);
        } catch (err) {
            setSupplierError(err.message || 'Error desconocido al cargar datos.');
            toast.error("No se pudieron cargar proveedores o estados.");
            setProviders([]);
            setSupplierStates([]);
        } finally {
            setLoadingSuppliers(false); // Siempre quitar loading al final
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrderError(null);
        try {
            const params = new URLSearchParams();
            if (debouncedSearchTermOrders) params.append('search', debouncedSearchTermOrders);
            // Ensure endpoint is correct for purchase orders
            const data = await apiClient(`/api/compras/compras/?${params.toString()}`);
            setOrders(data.results || data || []);
        } catch (err) {
            setOrderError(err.message);
            toast.error("No se pudieron cargar las órdenes de compra.");
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, [debouncedSearchTermOrders]);

    // --- EFFECTS ---
    useEffect(() => {
        fetchSuppliersAndStates(); // Load suppliers and states on mount
    }, [fetchSuppliersAndStates]);

    useEffect(() => {
        if (viewMode === 'orders') {
            fetchOrders(); // Load orders when switching or searching
        }
    }, [viewMode, fetchOrders]); // fetchOrders depends on debouncedSearchTermOrders

    // --- FILTERING & SORTING ---
    const sortedAndFilteredSuppliers = useMemo(() => {
        let filtered = [...providers];
        // 1. Filter by Search Term
        if (searchTermSuppliers) {
            const lowerSearch = searchTermSuppliers.toLowerCase();
            filtered = filtered.filter(supplier =>
                supplier.nombre_proveedor.toLowerCase().includes(lowerSearch) ||
                (supplier.razon_social_proveedor && supplier.razon_social_proveedor.toLowerCase().includes(lowerSearch)) ||
                (supplier.cuit_proveedor && supplier.cuit_proveedor.includes(lowerSearch)) ||
                (supplier.correo_proveedor && supplier.correo_proveedor.toLowerCase().includes(lowerSearch)) ||
                (supplier.telefono_proveedor && supplier.telefono_proveedor.includes(lowerSearch))
            );
        }
        // 2. Filter by Status
        if (selectedStatus) {
            filtered = filtered.filter(p => p.estado_proveedor?.id_estado == selectedStatus);
        }
        // 3. Sorting
        if (sortConfig.key) {
           filtered.sort((a, b) => {
                let aValue = sortConfig.key === 'estado_proveedor' ? (a.estado_proveedor?.nombre_estado || '') : (a[sortConfig.key] || '');
                let bValue = sortConfig.key === 'estado_proveedor' ? (b.estado_proveedor?.nombre_estado || '') : (b[sortConfig.key] || '');
                const comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true, sensitivity: 'base' });
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return filtered;
    }, [providers, searchTermSuppliers, sortConfig, selectedStatus]);

    const filteredOrders = useMemo(() => {
        // Assuming backend handles search, potentially add frontend filters later if needed
        return orders;
    }, [orders]);

    // --- HELPER FUNCTIONS ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- MODAL & ACTION HANDLERS ---
    // Suppliers
    const handleSupplierSuccess = () => { fetchSuppliersAndStates(); setShowNewProviderModal(false); setShowEditProviderModal(false); };
    const handleEditClick = (provider) => { setEditingProvider(provider); setShowEditProviderModal(true); };
    const handleDeleteRequest = (provider) => { setProviderToDelete(provider); };
    const handleConfirmDeleteSupplier = async () => {
        if (!providerToDelete) return;
        const loadingToast = toast.loading('Eliminando proveedor...');
        try {
            await apiClient(`/api/compras/proveedores/${providerToDelete.id_proveedor}/`, { method: 'DELETE' });
            toast.success(`Proveedor "${providerToDelete.nombre_proveedor}" eliminado.`, { id: loadingToast });
            fetchSuppliersAndStates(); // Refresh suppliers list
        } catch (error) {
            toast.error(error.data?.detail || 'Error al eliminar el proveedor.', { id: loadingToast });
        } finally {
            setProviderToDelete(null);
        }
    };

    // Orders
    const handleOrderSuccess = () => { setShowNewOrderModal(false); fetchOrders(); };
    const handleMarkAsReceived = async (orderId) => {
        // --- !!! IMPORTANT: Replace '5' with the actual ID for the "Recibida" state !!! ---
        const receivedStatusId = 5;

        const loadingToast = toast.loading('Marcando como recibida...');
        try {
            // Use the correct endpoint for purchase orders
            await apiClient(`/api/compras/compras/${orderId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ estado_compra: receivedStatusId })
            });
            toast.success('Orden marcada como recibida.', { id: loadingToast });
            fetchOrders(); // Refresh orders list
        } catch (err) {
             toast.error(err.data?.detail || 'No se pudo actualizar la orden.', { id: loadingToast });
        }
    };

    // --- RENDER FUNCTIONS FOR VIEWS ---
    const renderSuppliersView = () => {
        // Loading State
         if (loadingSuppliers) {
             return (
                <div className="flex justify-center items-center h-64 text-pr-yellow">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
                </div>
            );
         }
         // Error State
         if (supplierError) {
             return (
                <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                    <div>
                        <strong className="font-bold">Error al cargar:</strong>
                        <span className="block sm:inline ml-2">{supplierError}</span>
                    </div>
                </div>
            );
         }
         // Main Content
         return (
             <div>
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar proveedor..."
                            value={searchTermSuppliers}
                            onChange={(e) => setSearchTermSuppliers(e.target.value)}
                            className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-gray" />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="p-2 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow min-w-[180px]"
                    >
                        <option value="">Filtrar por Estado</option>
                        {supplierStates.map(state => (
                            <option key={state.id_estado} value={state.id_estado}>
                                {state.nombre_estado}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Suppliers Table */}
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto border border-pr-gray/20">
                    <table className="w-full text-sm text-left text-gray-400">
                         <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                             <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSort('nombre_proveedor')}>
                                    <div className="flex items-center">Nombre Proveedor<SortIndicator direction={sortConfig.key === 'nombre_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors hidden sm:table-cell" onClick={() => requestSort('razon_social_proveedor')}>
                                   <div className="flex items-center">Razón Social<SortIndicator direction={sortConfig.key === 'razon_social_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors hidden md:table-cell" onClick={() => requestSort('correo_proveedor')}>
                                    <div className="flex items-center">Email<SortIndicator direction={sortConfig.key === 'correo_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors hidden lg:table-cell" onClick={() => requestSort('telefono_proveedor')}>
                                    <div className="flex items-center">Teléfono<SortIndicator direction={sortConfig.key === 'telefono_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors hidden xl:table-cell" onClick={() => requestSort('cuit_proveedor')}>
                                    <div className="flex items-center">CUIT<SortIndicator direction={sortConfig.key === 'cuit_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSort('estado_proveedor')}>
                                    <div className="flex items-center">Estado<SortIndicator direction={sortConfig.key === 'estado_proveedor' ? sortConfig.direction : null} /></div>
                                </th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredSuppliers.length > 0 ? (
                                sortedAndFilteredSuppliers.map((provider) => (
                                    <tr key={provider.id_proveedor} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800 transition-colors">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{provider.nombre_proveedor}</th>
                                        <td className="px-6 py-4 hidden sm:table-cell">{provider.razon_social_proveedor || '-'}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{provider.correo_proveedor || '-'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">{provider.telefono_proveedor || '-'}</td>
                                        <td className="px-6 py-4 hidden xl:table-cell">{provider.cuit_proveedor || '-'}</td>
                                        <td className="px-6 py-4"><StatusBadge estado={provider.estado_proveedor} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex items-center space-x-2">
                                                 <button onClick={() => handleEditClick(provider)} className="bg-pr-gray/10 text-cyan-400 py-1 px-3 rounded-md text-sm font-medium hover:bg-cyan-400 hover:text-pr-dark transition-colors" title="Editar proveedor"><FontAwesomeIcon icon={faEdit} /></button>
                                                 <button onClick={() => handleDeleteRequest(provider)} className="bg-pr-gray/10 text-red-500 py-1 px-3 rounded-md text-sm font-medium hover:bg-red-500 hover:text-pr-dark transition-colors" title="Eliminar proveedor"><FontAwesomeIcon icon={faTrash} /></button>
                                             </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center p-12 text-pr-gray">
                                        <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                                        <p className="font-bold text-white text-lg">{searchTermSuppliers || selectedStatus ? 'No se encontraron proveedores con esos filtros.' : 'No hay proveedores registrados.'}</p>
                                        {!searchTermSuppliers && !selectedStatus && <p className="text-sm">Puedes añadir uno usando el botón "Nuevo Proveedor".</p>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
         );
    };

    const renderOrdersView = () => {
         // Loading State
         if (loadingOrders) {
             return (
                 <div className="flex justify-center items-center h-64 text-pr-yellow">
                     <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
                 </div>
             );
         }
         // Error State
         if (orderError) {
              return (
                 <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                    <div>
                        <strong className="font-bold">Error al cargar órdenes:</strong>
                        <span className="block sm:inline ml-2">{orderError}</span>
                    </div>
                 </div>
             );
         }
         // Main Content
         return (
             <div>
                 {/* Button New Order & Search */}
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                       <button onClick={() => setShowNewOrderModal(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" /> Nueva Orden
                       </button>
                       <div className="relative w-full sm:w-1/2 mt-4 sm:mt-0">
                           <input
                                value={searchTermOrders}
                                onChange={(e) => setSearchTermOrders(e.target.value)}
                                placeholder="Buscar Orden (ID, Proveedor, Estado)..."
                                className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                           />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-gray"/>
                       </div>
                 </div>
                 {/* Orders Table */}
                 {filteredOrders.length > 0 ? (
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto border border-pr-gray/20">
                        <table className="w-full text-sm text-left text-gray-400">
                             <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                                <tr>
                                    {/* Consider adding sorting for orders too */}
                                    <th className="px-4 py-2">ID Orden</th>
                                    <th className="px-4 py-2">Fecha</th>
                                    <th className="px-4 py-2">Proveedor</th>
                                    <th className="px-4 py-2 text-right">Total</th> {/* Align right */}
                                    <th className="px-4 py-2">Estado</th>
                                    <th className="px-4 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredOrders.map(order => (
                                    <tr key={order.id_compra} className="bg-pr-dark-gray hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-2 font-mono text-xs">{order.id_compra}</td>
                                        <td className="px-4 py-2">{new Date(order.fecha_compra).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-white">{order.proveedor_compra?.nombre_proveedor || '-'}</td>
                                        <td className="px-4 py-2 text-white font-medium text-right">{formatCurrency(order.total_compra)}</td>
                                        <td className="px-4 py-2"><StatusBadge estado={order.estado_compra} /></td>
                                        <td className="px-4 py-2">
                                            {/* Adjust 'Recibida' if state name is different */}
                                            {order.estado_compra?.nombre_estado !== 'Recibida' ? (
                                                <button
                                                    onClick={() => handleMarkAsReceived(order.id_compra)}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded flex items-center gap-1 transition-colors"
                                                    title="Marcar como Recibida"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} size="sm"/> Recibida
                                                </button>
                                            ) : (
                                                 <span className="text-xs text-green-400 italic">Completada</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    // Empty State Orders
                     <div className="text-center p-12 text-pr-gray bg-pr-dark rounded-lg border border-pr-gray/20">
                        <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                        <p className="font-bold text-white text-lg">{searchTermOrders ? 'No se encontraron órdenes con ese término.' : 'No hay órdenes de compra registradas.'}</p>
                        {!searchTermOrders && <p className="text-sm">Puedes crear una usando el botón "Nueva Orden".</p>}
                    </div>
                 )}
            </div>
         );
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Compras y Proveedores</h1>

            {/* --- Navigation Tabs --- */}
            <div className="mb-6 flex space-x-2 border-b border-gray-700">
                <button
                    onClick={() => setViewMode('suppliers')}
                    className={`py-2 px-4 font-medium transition-colors ${viewMode === 'suppliers' ? 'text-pr-yellow border-b-2 border-pr-yellow' : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'}`}
                >
                    Proveedores
                </button>
                <button
                    onClick={() => setViewMode('orders')}
                    className={`py-2 px-4 font-medium transition-colors ${viewMode === 'orders' ? 'text-pr-yellow border-b-2 border-pr-yellow' : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'}`}
                >
                    Órdenes de Compra
                </button>
            </div>

            {/* --- Conditional View Rendering --- */}
            {viewMode === 'suppliers' ? renderSuppliersView() : renderOrdersView()}


            {/* --- Modals --- */}
            <NewProviderModal isOpen={showNewProviderModal} onClose={() => setShowNewProviderModal(false)} onSuccess={handleSupplierSuccess} supplierStates={supplierStates} />
            <EditProviderModal isOpen={showEditProviderModal} onClose={() => setShowEditProviderModal(false)} onSuccess={handleSupplierSuccess} provider={editingProvider} supplierStates={supplierStates} />
            <ConfirmDeleteModal isOpen={!!providerToDelete} onClose={() => setProviderToDelete(null)} onConfirm={handleConfirmDeleteSupplier} itemName={providerToDelete?.nombre_proveedor} itemType="proveedor"/>
            <NewOrdenCompraModal isOpen={showNewOrderModal} onClose={() => setShowNewOrderModal(false)} onSuccess={handleOrderSuccess} suppliers={providers} />
        </>
    );
};

export default JefeSuppliers;
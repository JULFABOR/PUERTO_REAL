import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    faCircle,
    faFileInvoiceDollar,
    faEye 
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import useDebounce from '../../hooks/useDebounce'; 

// --- Modals --- 
// (Asumimos que estos ya están refactorizados o lo estarán)
import NewProviderModal from '@/components/Modals/proveedores/NewProviderModal';
import EditProviderModal from '@/components/Modals/Proveedores/EditProviderModal';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
import NewOrdenCompraModal from '@/components/Modals/ControlStock/NewOrdenCompraModal';
import OrderDetailsModal from '@/components/Modals/ControlStock/OrderDetailsModal'; 
import EditOrderModal from '@/components/Modals/ControlStock/EditOrderModal';

// --- HELPER COMPONENT: SORT INDICATOR (Sin cambios) ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- HELPER COMPONENT: STATUS BADGE (Sin cambios) ---
const StatusBadge = ({ estado }) => {
    const nombreEstado = estado?.nombre_estado?.toLowerCase() || '';
    let bgColor = 'bg-gray-700'; 
    let textColor = 'text-gray-300';

    if (nombreEstado === 'activo' || nombreEstado === 'recibida') {
        bgColor = 'bg-green-600/20';
        textColor = 'text-green-300';
    } else if (nombreEstado === 'pendiente') {
        bgColor = 'bg-yellow-600/20';
        textColor = 'text-yellow-300';
    } else if (nombreEstado === 'inactivo' || nombreEstado === 'cancelada') {
        bgColor = 'bg-red-600/20';
        textColor = 'text-red-300';
    }

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
    // --- STATE MANAGEMENT (Sin cambios) ---
    const [viewMode, setViewMode] = useState('suppliers');
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
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderError, setOrderError] = useState(null);
    const [searchTermOrders, setSearchTermOrders] = useState('');
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [orderToView, setOrderToView] = useState(null);
    const [orderToEdit, setOrderToEdit] = useState(null);
    const [orderStates, setOrderStates] = useState([]);
    const debouncedSearchTermOrders = useDebounce(searchTermOrders, 300);
    const [sortConfigOrders, setSortConfigOrders] = useState({ key: 'fecha_compra', direction: 'descending' });


    // --- DATA FETCHING (REFACTORIZADO) ---
    
    // --- CAMBIO 1: fetchSuppliersAndStates con Axios ---
    const fetchSuppliersAndStates = useCallback(async () => {
        setLoadingSuppliers(true);
        setSupplierError(null);
        try {
            // Usamos apiClient.get() y quitamos /api/
            const [suppliersResponse, supStatesResponse, ordStatesResponse] = await Promise.all([
                apiClient.get('/compras/proveedores/'),
                apiClient.get('/compras/estados-proveedor/'),
                apiClient.get('/compras/estados_compra/')
            ]);
            
            // Leemos los datos desde la propiedad .data
            setProviders(suppliersResponse.data || []);
            setSupplierStates(supStatesResponse.data || []);
            setOrderStates(ordStatesResponse.data || []);
            
        } catch (err) {
            // Usamos err.response.data.detail para errores de Axios
            const errorMsg = err.response?.data?.detail || err.message || 'Error desconocido al cargar datos.';
            setSupplierError(errorMsg);
            toast.error("No se pudieron cargar proveedores o estados.");
            setProviders([]);
            setSupplierStates([]);
            setOrderStates([]);
        } finally {
            setLoadingSuppliers(false);
        }
    }, []);

    // --- CAMBIO 2: fetchOrders con Axios ---
    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrderError(null);
        try {
            // Usamos el objeto 'params' de Axios
            const params = {};
            if (debouncedSearchTermOrders) params.search = debouncedSearchTermOrders;
            
            // Nota: antes se usaba `apiClient('/api/...')`. Ahora usar `apiClient.get('/compras/compras/', { params })`
            // Ahora:
            const response = await apiClient.get('/compras/compras/', { params });
            
            setOrders(response.data.results || response.data || []);
        
        } catch (err) {
            // Usamos err.response.data.detail
            const errorMsg = err.response?.data?.detail || err.message;
            setOrderError(errorMsg);
            toast.error("No se pudieron cargar las órdenes de compra.");
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, [debouncedSearchTermOrders]);

    // --- EFFECTS (Sin cambios) ---
    useEffect(() => {
        fetchSuppliersAndStates();
    }, [fetchSuppliersAndStates]);

    useEffect(() => {
        if (viewMode === 'orders') {
            fetchOrders(); 
        }
    }, [viewMode, fetchOrders]); 

    // --- FILTERING & SORTING (Sin cambios) ---
    const sortedAndFilteredSuppliers = useMemo(() => {
        let filtered = [...providers];
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
        if (selectedStatus) {
            filtered = filtered.filter(p => p.estado_proveedor?.id_estado == selectedStatus);
        }
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
        let sortedOrders = [...orders]; 
        
        if (sortConfigOrders.key) {
            sortedOrders.sort((a, b) => {
                let aValue = a[sortConfigOrders.key];
                let bValue = b[sortConfigOrders.key];

                if (sortConfigOrders.key === 'proveedor_compra') {
                    aValue = a.proveedor_compra?.nombre_proveedor || '';
                    bValue = b.proveedor_compra?.nombre_proveedor || '';
                }
                if (sortConfigOrders.key === 'estado_compra') {
                    aValue = a.estado_compra?.nombre_estado || '';
                    bValue = b.estado_compra?.nombre_estado || '';
                }

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (sortConfigOrders.key === 'total_compra') {
                    return sortConfigOrders.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }

                const comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true, sensitivity: 'base' });
                return sortConfigOrders.direction === 'ascending' ? comparison : -comparison;
            });
        }

        return sortedOrders;
    }, [orders, sortConfigOrders]);

    // --- HELPER FUNCTIONS (Sin cambios) ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const requestSortOrders = (key) => {
        let direction = 'ascending';
        if (sortConfigOrders.key === key && sortConfigOrders.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfigOrders.key === key) {
            direction = 'ascending';
        }
        setSortConfigOrders({ key, direction });
    };

    const formatCurrency = (value) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- MODAL & ACTION HANDLERS (REFACTORIZADOS) ---
    
    // Suppliers
    const handleAddProvider = () => {
        setShowNewProviderModal(true);
    };
    const handleSupplierSuccess = () => { fetchSuppliersAndStates(); setShowNewProviderModal(false); setShowEditProviderModal(false); };
    const handleEditClick = (provider) => { setEditingProvider(provider); setShowEditProviderModal(true); };
    const handleDeleteRequest = (provider) => { setProviderToDelete(provider); };
    
    // --- CAMBIO 3: handleConfirmDeleteSupplier con Axios ---
    const handleConfirmDeleteSupplier = async () => {
        if (!providerToDelete) return;
        const loadingToast = toast.loading('Eliminando proveedor...');
        try {
            // Antes: await apiClient(url, { method: 'DELETE' });
            // Ahora:
            await apiClient.delete(`/compras/proveedores/${providerToDelete.id_proveedor}/`);
            
            toast.success(`Proveedor "${providerToDelete.nombre_proveedor}" eliminado.`, { id: loadingToast });
            fetchSuppliersAndStates(); 
        } catch (error) {
            // Usamos error.response.data
            const errorMsg = error.response?.data?.detail || 'Error al eliminar el proveedor.';
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setProviderToDelete(null);
        }
    };

    // Orders
    const handleOrderSuccess = () => { 
        setShowNewOrderModal(false); 
        setOrderToEdit(null); 
        fetchOrders(); 
    };
    
    // --- CAMBIO 4: handleMarkAsReceived con Axios ---
    const handleMarkAsReceived = async (orderId) => {
        const receivedStatusId = 10; // Asumes que 10 es 'Recibida'
        const loadingToast = toast.loading('Marcando como recibida...');
        
        try {
            // Antes: await apiClient(url, { method: 'PATCH', body: ... })
            // Ahora: apiClient.patch(ruta_sin_api, payload)
            await apiClient.patch(`/compras/compras/${orderId}/`, {
                estado_compra: receivedStatusId 
            });
            
            toast.success('Orden marcada como recibida.', { id: loadingToast });
            fetchOrders(); // Refresh orders list
        } catch (err) {
            // Usamos err.response.data
            const errorMsg = err.response?.data?.detail || 'No se pudo actualizar la orden.';
            toast.error(errorMsg, { id: loadingToast });
        }
    };

    // --- RENDER FUNCTIONS FOR VIEWS (Sin cambios) ---
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
                    <button
                        onClick={handleAddProvider}
                        className="btn-primary px-4 py-2 flex items-center shrink-0 ml-4"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Añadir Proveedor
                    </button>
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
                    <div className="relative w-full sm:w-1/2 mt-4 sm:mt-0">
                        <input
                            value={searchTermOrders}
                            onChange={(e) => setSearchTermOrders(e.target.value)}
                            placeholder="Buscar Orden (ID, Proveedor, Estado)..."
                            className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-gray"/>
                    </div>
                    <button onClick={() => setShowNewOrderModal(true)} className="btn-primary px-4 py-2 flex items-center shrink-0 ml-4">
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" /> Nueva Orden
                    </button>
                </div>
                {/* Orders Table */}
                {filteredOrders.length > 0 ? (
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto border border-pr-gray/20">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSortOrders('id_compra')}>
                                        <div className="flex items-center">
                                            ID Orden <SortIndicator direction={sortConfigOrders.key === 'id_compra' ? sortConfigOrders.direction : null} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSortOrders('fecha_compra')}>
                                        <div className="flex items-center">
                                            Fecha <SortIndicator direction={sortConfigOrders.key === 'fecha_compra' ? sortConfigOrders.direction : null} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSortOrders('proveedor_compra')}>
                                        <div className="flex items-center">
                                            Proveedor <SortIndicator direction={sortConfigOrders.key === 'proveedor_compra' ? sortConfigOrders.direction : null} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 text-right cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSortOrders('total_compra')}>
                                        <div className="flex items-center justify-end">
                                            Total <SortIndicator direction={sortConfigOrders.key === 'total_compra' ? sortConfigOrders.direction : null} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => requestSortOrders('estado_compra')}>
                                        <div className="flex items-center">
                                            Estado <SortIndicator direction={sortConfigOrders.key === 'estado_compra' ? sortConfigOrders.direction : null} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredOrders.map(order => (
                                    <tr key={order.id_compra} className="bg-pr-dark-gray hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-2 font-mono text-xs">{order.id_compra}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {new Date(order.fecha_compra).toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-2 text-white">{order.proveedor_compra?.nombre_proveedor || '-'}</td>
                                        <td className="px-4 py-2 text-white font-medium text-right">{formatCurrency(order.total_compra)}</td>
                                        <td className="px-4 py-2"><StatusBadge estado={order.estado_compra} /></td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => setOrderToView(order)}
                                                    className="bg-pr-gray/10 text-cyan-400 py-1 px-2 rounded-md text-sm font-medium hover:bg-cyan-400 hover:text-pr-dark transition-colors" 
                                                    title="Ver detalles de la orden"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button 
                                                    onClick={() => setOrderToEdit(order)}
                                                    className="bg-pr-gray/10 text-pr-yellow py-1 px-2 rounded-md text-sm font-medium hover:bg-pr-yellow hover:text-pr-dark transition-colors" 
                                                    title="Editar estado de la orden"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                            </div>
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

    // --- RENDERIZADO PRINCIPAL ---
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
            <NewProviderModal 
                isOpen={showNewProviderModal}
                onClose={() => setShowNewProviderModal(false)} 
                onSuccess={handleSupplierSuccess} 
                supplierStates={supplierStates} 
            />
            <EditProviderModal 
                isOpen={showEditProviderModal} 
                onClose={() => setShowEditProviderModal(false)} 
                onSuccess={handleSupplierSuccess} 
                provider={editingProvider} 
                supplierStates={supplierStates} 
            />
            <ConfirmDeleteModal 
                isOpen={!!providerToDelete} 
                onClose={() => setProviderToDelete(null)} 
                onConfirm={handleConfirmDeleteSupplier} 
                itemName={providerToDelete?.nombre_proveedor} 
                itemType="proveedor"
            />
            <NewOrdenCompraModal 
                isOpen={showNewOrderModal} 
                onClose={() => setShowNewOrderModal(false)} 
                onSuccess={handleOrderSuccess} 
                suppliers={providers} 
            />
            <OrderDetailsModal
                isOpen={!!orderToView}
                onClose={() => setOrderToView(null)}
                order={orderToView}
            />
            <EditOrderModal
                isOpen={!!orderToEdit}
                onClose={() => setOrderToEdit(null)}
                onSuccess={handleOrderSuccess}
                order={orderToEdit}
                orderStates={orderStates} 
            />
        </>
    );
};

export default JefeSuppliers;
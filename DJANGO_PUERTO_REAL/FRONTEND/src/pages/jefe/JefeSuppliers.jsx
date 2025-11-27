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
    faEye,
    faTruck,
    faLandmark,
    faChartPie,
    faCrown
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
        
        // --- HELPER COMPONENT: SORTABLE HEADER ---
        const SortableHeader = ({ name, sortConfig, onSort, children }) => (
            <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => onSort(name)}>
                <div className="flex items-center">
                    {children}
                    <SortIndicator direction={sortConfig.key === name ? sortConfig.direction : null} />
                </div>
            </th>
        );
        
        const formatDate = (dateString) => {
            if (!dateString) return <span className="text-gray-500">N/A</span>;
            const date = new Date(dateString);
            return date.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };
        
        
        const JefeSuppliers = () => {
            // --- STATE MANAGEMENT (Sin cambios) ---
            const [viewMode, setViewMode] = useState('suppliers');
            const [providers, setProviders] = useState([]);    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
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

    const supplierStats = useMemo(() => {
        const totalProviders = providers.length;
        if (totalProviders === 0) return { totalProviders: 0, totalSpend: 0, topProviderName: 'N/A', avgPurchases: 0 };
        
        const totalSpend = providers.reduce((sum, p) => sum + parseFloat(p.gasto_total || 0), 0);
        
        const topProvider = providers.reduce((max, p) => {
            return (parseFloat(p.gasto_total || 0) > parseFloat(max.gasto_total || 0)) ? p : max;
        }, providers[0] || { gasto_total: 0 });

        const totalPurchases = providers.reduce((sum, p) => sum + (p.numero_de_compras || 0), 0);
        
        const avgPurchases = totalProviders > 0 ? totalPurchases / totalProviders : 0;

        return {
            totalProviders,
            totalSpend,
            topProviderName: topProvider?.nombre_proveedor || 'N/A',
            avgPurchases: avgPurchases.toFixed(1)
        };
    }, [providers]);

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
        if (loadingSuppliers) {
            return (
                <div className="flex justify-center items-center h-64">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-pr-yellow" />
                </div>
            );
        }
        if (supplierError) {
            return <div className="p-4 bg-red-900/20 text-red-300 rounded-lg">{supplierError}</div>;
        }

        return (
            <div className="bg-pr-dark-gray p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Panel Estratégico de Proveedores</h2>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-pr-yellow">
                        <FontAwesomeIcon icon={faTruck} className="text-2xl text-pr-yellow mb-3" />
                        <p className="text-sm text-gray-400">Total Proveedores</p>
                        <p className="text-3xl font-bold text-white">{supplierStats.totalProviders}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-green-500">
                        <FontAwesomeIcon icon={faLandmark} className="text-2xl text-green-500 mb-3" />
                        <p className="text-sm text-gray-400">Gasto Total</p>
                        <p className="text-3xl font-bold text-white">{formatCurrency(supplierStats.totalSpend)}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
                        <FontAwesomeIcon icon={faChartPie} className="text-2xl text-blue-500 mb-3" />
                        <p className="text-sm text-gray-400">Promedio Compras</p>
                        <p className="text-3xl font-bold text-white">{supplierStats.avgPurchases}</p>
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
                        <FontAwesomeIcon icon={faCrown} className="text-2xl text-purple-500 mb-3" />
                        <p className="text-sm text-gray-400">Proveedor Principal</p>
                        <p className="text-xl font-bold text-white truncate pt-2">{supplierStats.topProviderName}</p>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-pr-dark p-4 rounded-lg mb-6 border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-grow w-full">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="text" placeholder="Buscar proveedor..." value={searchTermSuppliers} onChange={(e) => setSearchTermSuppliers(e.target.value)} className="w-full p-2 pl-10 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-pr-yellow focus:border-pr-yellow" />
                    </div>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full md:w-auto p-2 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-pr-yellow focus:border-pr-yellow">
                        <option value="">Todos los Estados</option>
                        {supplierStates.map(state => <option key={state.id_estado} value={state.id_estado}>{state.nombre_estado}</option>)}
                    </select>
                    <button onClick={() => setShowNewProviderModal(true)} className="btn-primary w-full md:w-auto shrink-0">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Nuevo Proveedor
                    </button>
                </div>

                {/* Suppliers Table */}
                <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-white uppercase bg-pr-dark border-b border-gray-700">
                            <tr>
                                <SortableHeader name="nombre_proveedor" sortConfig={sortConfig} onSort={requestSort}>Proveedor</SortableHeader>
                                <SortableHeader name="gasto_total" sortConfig={sortConfig} onSort={requestSort}>Gasto Total</SortableHeader>
                                <SortableHeader name="numero_de_compras" sortConfig={sortConfig} onSort={requestSort}>Nº Compras</SortableHeader>
                                <SortableHeader name="ultima_compra" sortConfig={sortConfig} onSort={requestSort}>Última Compra</SortableHeader>
                                <SortableHeader name="estado_proveedor" sortConfig={sortConfig} onSort={requestSort}>Estado</SortableHeader>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredSuppliers.length > 0 ? (
                                sortedAndFilteredSuppliers.map((provider) => (
                                    <tr key={provider.id_proveedor} className="border-b bg-pr-dark-gray border-gray-700 hover:bg-gray-800 transition-colors">
                                        <th scope="row" className="px-6 py-4 font-medium text-white">
                                            <div className="flex flex-col">
                                                <span>{provider.nombre_proveedor}</span>
                                                <span className="text-xs text-gray-500">{provider.cuit_proveedor}</span>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 font-mono text-lg">{formatCurrency(provider.gasto_total)}</td>
                                        <td className="px-6 py-4 text-center">{provider.numero_de_compras}</td>
                                        <td className="px-6 py-4">{formatDate(provider.ultima_compra)}</td>
                                        <td className="px-6 py-4"><StatusBadge estado={provider.estado_proveedor} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditClick(provider)} className="btn-icon-edit" title="Editar"><FontAwesomeIcon icon={faEdit} /></button>
                                                <button onClick={() => handleDeleteRequest(provider)} className="btn-icon-delete" title="Eliminar"><FontAwesomeIcon icon={faTrash} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-12 text-gray-500">
                                        <FontAwesomeIcon icon={faInbox} className="text-4xl mb-4" />
                                        <p className="font-bold text-white">No se encontraron proveedores.</p>
                                        <p className="text-sm">{searchTermSuppliers || selectedStatus ? 'Intenta ajustar los filtros.' : 'Puedes añadir uno usando el botón "Nuevo Proveedor".'}</p>
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
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faInbox,
    faEdit,
    faSort,
    faSortUp,
    faSortDown,
    faCircle,
    faEye
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import NewProviderModal from '@/components/Modals/Proveedores/NewProviderModal';
import ProviderDetailsModal from '@/components/Modals/Proveedores/ProviderDetailsModal';
import EditProviderModal from '@/components/Modals/Proveedores/EditProviderModal';

// --- HELPER COMPONENT SORT INDICATOR (Sin cambios) ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- HELPER COMPONENT STATUS BADGE (Sin cambios) ---
const StatusBadge = ({ estado }) => {
    const nombreEstado = estado?.nombre_estado?.toLowerCase() || '';
    let bgColor = 'bg-gray-700';
    let textColor = 'text-gray-300';

    if (nombreEstado === 'activo') {
        bgColor = 'bg-green-600/20';
        textColor = 'text-green-300';
    } else if (nombreEstado === 'inactivo') {
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

const Proveedores = () => {
    // --- Estados (Sin cambios) ---
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierStates, setSupplierStates] = useState([]);
    const [isNewProviderModalOpen, setIsNewProviderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_proveedor', direction: 'ascending' });

    
    // --- CAMBIOS EN fetchInitialData ---
    const fetchInitialData = useCallback(async () => {
        setError(null);
        try {
            // 1. Usamos apiClient.get() y quitamos /api/ de las rutas
            const [providersResponse, statesResponse] = await Promise.all([
                apiClient.get('/compras/proveedores/'),
                apiClient.get('/compras/estados-proveedor/') 
            ]);

            // 2. Los datos ahora están en la propiedad .data
            const providersData = providersResponse.data;
            const statesData = statesResponse.data;

            setProviders(providersData || []);
            setSupplierStates(statesData || []); 
        
        } catch (err) {
            // 3. Mejoramos el manejo de errores de Axios
            const errorMsg = err.response?.data?.detail || err.message || 'Error desconocido al cargar datos.';
            setError(errorMsg);
            toast.error("No se pudieron cargar proveedores o estados."); 
            setProviders([]);
            setSupplierStates([]);
        
        } finally {
             if(loading) setLoading(false);
        }
    // 4. FIX: Quitamos [loading] de las dependencias para evitar un bucle infinito
    }, []); 

    useEffect(() => {
        fetchInitialData(); 
    }, [fetchInitialData]);

    
    // --- Resto del componente (Sin cambios) ---

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredProviders = useMemo(() => {
        let filtered = [...providers];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(supplier =>
                supplier.nombre_proveedor.toLowerCase().includes(lowerSearch) ||
                (supplier.razon_social_proveedor && supplier.razon_social_proveedor.toLowerCase().includes(lowerSearch)) ||
                (supplier.cuit_proveedor && supplier.cuit_proveedor.includes(lowerSearch)) ||
                (supplier.correo_proveedor && supplier.correo_proveedor.toLowerCase().includes(lowerSearch)) ||
                (supplier.telefono_proveedor && supplier.telefono_proveedor.includes(lowerSearch))
            );
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
    }, [providers, searchTerm, sortConfig]);

    const handleAddProvider = () => {
        setIsNewProviderModalOpen(true);
    };

    const handleViewDetails = (provider) => {
        setSelectedProvider(provider);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEditModal = (provider) => {
        setSelectedProvider(provider);
        setIsEditModalOpen(true);
    };

    const handleSuccess = () => {
        fetchInitialData(); 
        setIsNewProviderModalOpen(false);
        setIsEditModalOpen(false);
    };

    if (loading) {
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
        <div>
            {/* --- CABECERA Y BÚSQUEDA --- */}
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Proveedores</h1>
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2"> 
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CUIT, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /> 
                </div>
                <button
                    onClick={handleAddProvider}
                    className="btn-primary px-4 py-2 flex items-center shrink-0 ml-4"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Proveedor
                </button>
            </div>

            {/* --- TABLA DE PROVEEDORES --- */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto border border-pr-gray/20">
                <table className="w-full text-left text-white">
                    <thead className="border-b border-pr-gray/20 text-white uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4 font-medium cursor-pointer hover:text-white" onClick={() => requestSort('nombre_proveedor')}>
                                <div className="flex items-center">
                                    Nombre Proveedor
                                    <SortIndicator direction={sortConfig.key === 'nombre_proveedor' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th className="p-4 font-medium hidden sm:table-cell cursor-pointer hover:text-white" onClick={() => requestSort('razon_social_proveedor')}>
                                <div className="flex items-center">
                                    Razón Social
                                    <SortIndicator direction={sortConfig.key === 'razon_social_proveedor' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th className="p-4 font-medium hidden md:table-cell cursor-pointer hover:text-white" onClick={() => requestSort('telefono_proveedor')}>
                                <div className="flex items-center">
                                    Teléfono
                                    <SortIndicator direction={sortConfig.key === 'telefono_proveedor' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th className="p-4 font-medium hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => requestSort('correo_proveedor')}>
                                <div className="flex items-center">
                                    Email
                                    <SortIndicator direction={sortConfig.key === 'correo_proveedor' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th className="p-4 font-medium cursor-pointer hover:text-white" onClick={() => requestSort('estado_proveedor')}>
                                <div className="flex items-center">
                                    Estado
                                    <SortIndicator direction={sortConfig.key === 'estado_proveedor' ? sortConfig.direction : null} />
                                </div>
                            </th>
                            <th className="p-4 font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProviders.length > 0 ? (
                            filteredProviders.map((provider) => (
                                <tr key={provider.id_proveedor} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray transition-colors">
                                    <td className="p-4 font-bold text-white whitespace-nowrap">{provider.nombre_proveedor}</td>
                                    <td className="p-4 hidden sm:table-cell">{provider.razon_social_proveedor || '-'}</td>
                                    <td className="p-4 hidden md:table-cell">{provider.telefono_proveedor || '-'}</td>
                                    <td className="p-4 hidden lg:table-cell">{provider.correo_proveedor || '-'}</td>
                                    <td className="p-4">
                                        <StatusBadge estado={provider.estado_proveedor} />
                                    </td>
                                    <td className="p-4 whitespace-nowrap"> 
                                        <div className="flex items-center space-x-2"> 
                                            <button
                                                onClick={() => handleViewDetails(provider)}
                                                className="bg-pr-gray/10 text-pr-yellow py-1 px-3 rounded-md text-sm font-medium hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(provider)}
                                                className="bg-pr-gray/10 text-cyan-400 py-1 px-3 rounded-md text-sm font-medium hover:bg-cyan-400 hover:text-pr-dark transition-colors"
                                                title="Editar Proveedor"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-12 text-gray-400"> 
                                    <FontAwesomeIcon icon={faInbox} className="text-4xl text-gray-600 mb-4" />
                                    <p className="font-bold text-white text-lg">
                                        {searchTerm ? 'No se encontraron proveedores.' : 'No hay proveedores registrados.'}
                                    </p>
                                    {!searchTerm && <p className="text-sm">Puedes añadir uno usando el botón "Añadir Proveedor".</p>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Modales --- */}
            <NewProviderModal
                isOpen={isNewProviderModalOpen}
                onClose={() => setIsNewProviderModalOpen(false)}
                onSuccess={handleSuccess}
                supplierStates={supplierStates} 
            />
            <ProviderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                provider={selectedProvider}
            />
            <EditProviderModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                provider={selectedProvider}
                onSuccess={handleSuccess}
                supplierStates={supplierStates} 
            />
        </div>
    );
};

export default Proveedores;
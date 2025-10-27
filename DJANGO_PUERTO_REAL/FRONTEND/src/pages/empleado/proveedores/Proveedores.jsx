import React, { useState, useEffect, useMemo, useCallback } from 'react'; // <-- Añadido useCallback
import apiClient from '@/api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faInbox,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast'; // <-- Añadido toast para errores
import NewProviderModal from '@/components/Modals/NewProviderModal'; // Ajusta ruta si es necesario
import ProviderDetailsModal from '@/components/Modals/ProviderDetailsModal'; // Ajusta ruta si es necesario
import EditProviderModal from '@/components/Modals/EditProviderModal'; // Ajusta ruta si es necesario

const Proveedores = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- AÑADIDO: Estado para guardar los estados posibles ---
    const [supplierStates, setSupplierStates] = useState([]);

    const [isNewProviderModalOpen, setIsNewProviderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);

    // --- MODIFICADO: fetchInitialData (ahora carga proveedores Y estados) ---
    const fetchInitialData = useCallback(async () => {
        // No mostrar spinner si ya no estaba cargando (para refrescos)
        setError(null);
        try {
            // Hacemos ambas llamadas en paralelo
            const [providersData, statesData] = await Promise.all([
                apiClient('/api/compras/proveedores/'),
                apiClient('/api/compras/estados-proveedor/') // <-- LLAMADA A ESTADOS
            ]);
            setProviders(providersData || []);
            setSupplierStates(statesData || []); // <-- GUARDA ESTADOS
        } catch (err) {
            setError(err.message || 'Error desconocido al cargar datos.');
            toast.error("No se pudieron cargar proveedores o estados."); // Mensaje más específico
            setProviders([]);
            setSupplierStates([]);
        } finally {
            // Solo quitar spinner si era la carga inicial
             if(loading) setLoading(false);
        }
    }, [loading]); // Depende de loading para saber si quitar spinner inicial

    useEffect(() => {
        fetchInitialData(); // Llama a la función que carga todo
    }, [fetchInitialData]);

    const filteredProviders = useMemo(() => {
        if (!searchTerm) return providers;
        const lowerSearch = searchTerm.toLowerCase();
        // Filtrado simple por nombre como estaba antes
        return providers.filter(provider =>
            provider.nombre_proveedor.toLowerCase().includes(lowerSearch)
        );
    }, [providers, searchTerm]);

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
        fetchInitialData(); // <-- Refresca proveedores Y estados
        setIsNewProviderModalOpen(false);
        setIsEditModalOpen(false);
    };

    // --- ESTADOS DE CARGA/ERROR ---
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
                <div className="relative w-full md:w-1/2"> {/* Ajustado ancho */}
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 pl-10 text-white focus:ring-pr-yellow focus:border-pr-yellow" // Añadido pl-10
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" /> {/* Icono dentro */}
                </div>
                <button
                    onClick={handleAddProvider}
                    className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center shrink-0 ml-4" // Añadido shrink-0 y ml-4
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Proveedor
                </button>
            </div>

            {/* --- TABLA DE PROVEEDORES --- */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto border border-pr-gray/20"> {/* Añadido borde */}
                <table className="w-full text-left text-pr-gray">
                    {/* Encabezado mejorado */}
                    <thead className="border-b border-pr-gray/20 text-pr-gray/80 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Nombre del Proveedor</th>
                            <th className="p-4 font-medium hidden sm:table-cell">Razón Social</th> {/* Ocultar en pantallas pequeñas */}
                            <th className="p-4 font-medium hidden md:table-cell">Teléfono</th> {/* Ocultar en medianas */}
                            <th className="p-4 font-medium hidden lg:table-cell">Email</th> {/* Ocultar en grandes */}
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
                                    <td className="p-4 whitespace-nowrap"> {/* Botones en una celda */}
                                        <div className="flex items-center space-x-2"> {/* Contenedor flex */}
                                            <button
                                                onClick={() => handleViewDetails(provider)}
                                                className="bg-pr-gray/10 text-pr-yellow py-1 px-3 rounded-md text-sm font-medium hover:bg-pr-yellow hover:text-pr-dark transition-colors"
                                                title="Ver Detalles"
                                            >
                                                Ver Detalles
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(provider)}
                                                className="bg-pr-gray/10 text-cyan-400 py-1 px-3 rounded-md text-sm font-medium hover:bg-cyan-400 hover:text-pr-dark transition-colors"
                                                title="Editar Proveedor"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            {/* El empleado no tiene botón de eliminar */}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            // --- ESTADO VACÍO ---
                            <tr>
                                <td colSpan="5" className="text-center p-12 text-pr-gray"> {/* Ajustado colSpan */}
                                    <FontAwesomeIcon icon={faInbox} className="text-4xl text-pr-gray/50 mb-4" />
                                    <p className="font-bold text-white text-lg">
                                        {searchTerm ? 'No se encontraron proveedores con ese nombre.' : 'No hay proveedores registrados.'}
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
                supplierStates={supplierStates} // Pasa estados
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
                supplierStates={supplierStates} // Pasa estados
            />
        </div>
    );
};

export default Proveedores;
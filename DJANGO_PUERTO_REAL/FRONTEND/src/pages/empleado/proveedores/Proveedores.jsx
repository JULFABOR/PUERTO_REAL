import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faTruck } from '@fortawesome/free-solid-svg-icons';

const Proveedores = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProviders = async () => {
            setLoading(true);
            try {
                // The endpoint might be nested under /api/compras/
                const data = await apiClient('/api/compras/proveedores/');
                setProviders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
    }, []);

    const filteredProviders = useMemo(() => {
        return providers.filter(provider =>
            provider.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [providers, searchTerm]);

    const handleAddProvider = () => {
        // Placeholder for add provider functionality
        alert("Funcionalidad para añadir proveedor no implementada.");
    };

    if (loading) {
        return <p className="text-center text-pr-gray">Cargando proveedores...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Proveedores</h1>

            {/* Search and Add Provider Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                </div>
                <button 
                    onClick={handleAddProvider}
                    className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Proveedor
                </button>
            </div>

            {/* Providers Table */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left text-pr-gray">
                    <thead className="border-b border-pr-gray/20">
                        <tr>
                            <th className="p-4">Nombre del Proveedor</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Teléfono</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProviders.length > 0 ? (
                            filteredProviders.map((provider) => (
                                <tr key={provider.id} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                    <td className="p-4 font-bold text-white">{provider.nombre}</td>
                                    <td className="p-4">{provider.persona_contacto}</td>
                                    <td className="p-4">{provider.telefono}</td>
                                    <td className="p-4">{provider.email}</td>
                                    <td className="p-4">
                                        <button className="text-pr-yellow hover:underline">Ver Detalles</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-8">No se encontraron proveedores.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Proveedores;

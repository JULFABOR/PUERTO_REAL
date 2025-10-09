import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

const Clientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const data = await apiClient('/api/fidelizacion/clientes/');
                setClients(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);
    
    const handleAddClient = () => {
        // Placeholder for add client functionality
        alert("Funcionalidad para añadir cliente no implementada.");
    };

    if (loading) {
        return <p className="text-center text-pr-gray">Cargando clientes...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Gestión de Clientes</h1>

            {/* Search and Add Client Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-1/2">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-pr-gray" />
                </div>
                <button 
                    onClick={handleAddClient}
                    className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Añadir Cliente
                </button>
            </div>

            {/* Clients Table */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left text-pr-gray">
                    <thead className="border-b border-pr-gray/20">
                        <tr>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Teléfono</th>
                            <th className="p-4">Puntos</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.id} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                    <td className="p-4 font-bold text-white">{client.nombre} {client.apellido}</td>
                                    <td className="p-4">{client.email}</td>
                                    <td className="p-4">{client.telefono}</td>
                                    <td className="p-4 font-bold text-pr-yellow">{client.puntos_actuales || 0}</td>
                                    <td className="p-4">
                                        <button className="text-pr-yellow hover:underline">Ver Perfil</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-8">No se encontraron clientes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Clientes;

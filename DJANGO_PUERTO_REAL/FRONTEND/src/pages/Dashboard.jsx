import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { FaDollarSign, FaBoxes, FaUserPlus } from 'react-icons/fa';

const Dashboard = () => {
    const [stats, setStats] = useState({
        today_sales: 0,
        low_stock_items: 0,
        new_customers_week: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Hacemos la llamada al endpoint /api/dashboard-stats/
                const response = await apiClient.get('/dashboard-stats/');
                setStats(response.data);
            } catch (err) {
                setError('No se pudieron cargar las estadísticas. Intente de nuevo más tarde.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando estadísticas...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Principal</h1>
            
            {/* Contenedor de las tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Card 1: Ventas de Hoy */}
                <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                    <div className="bg-green-100 p-4 rounded-full mr-4">
                        <FaDollarSign className="text-2xl text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-gray-500">Ventas de Hoy</h2>
                        <p className="text-2xl font-semibold text-gray-800">
                            ${stats.today_sales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Card 2: Items con Stock Bajo */}
                <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                    <div className="bg-orange-100 p-4 rounded-full mr-4">
                        <FaBoxes className="text-2xl text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-gray-500">Items con Stock Bajo</h2>
                        <p className="text-2xl font-semibold text-gray-800">{stats.low_stock_items}</p>
                    </div>
                </div>

                {/* Card 3: Nuevos Clientes */}
                <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                    <div className="bg-blue-100 p-4 rounded-full mr-4">
                        <FaUserPlus className="text-2xl text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-gray-500">Nuevos Clientes (Semana)</h2>
                        <p className="text-2xl font-semibold text-gray-800">{stats.new_customers_week}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
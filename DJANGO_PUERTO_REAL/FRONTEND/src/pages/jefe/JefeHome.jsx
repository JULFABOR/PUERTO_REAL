import { Link } from 'react-router-dom'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/jefe/StatCard.jsx';
import { 
    faBoxOpen, faPlusCircle, faAddressBook, faMoneyBillWave, faChartBar,
    faCog, faTruck, faUsers, faDollarSign, faTimes
} from '@fortawesome/free-solid-svg-icons';

const JefeHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        today_sales: 0,
        low_stock_items: 0,
        new_customers_week: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isWelcomeVisible, setWelcomeVisible] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/dashboard-stats/');
                setStats(response.data);
            } catch (err) {
                setError('No se pudieron cargar las estadísticas.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Componente interno para las tarjetas de acción para no repetir código
    const ActionCard = ({ to, icon, title, description }) => (
        <Link 
            to={to} 
            className="group bg-pr-dark rounded-xl p-6 flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg hover:shadow-pr-yellow/20"
        >
            <div className="bg-pr-dark-gray p-4 rounded-full mb-4">
                <FontAwesomeIcon icon={icon} className="text-pr-yellow text-3xl" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
        </Link>
    );

    return (
        <div className="space-y-10">
            {/* Banner de Bienvenida Descartable */}
            {isWelcomeVisible && (
                <div className="relative bg-pr-dark border border-pr-gray/50 rounded-lg p-6 flex items-center">
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold text-white">
                            Bienvenido de nuevo, <span className="text-pr-yellow">{user?.first_name || user?.username || 'Jefe'}</span>
                        </h1>
                        <p className="text-gray-400 mt-1">Aquí tienes un resumen de la actividad de tu negocio.</p>
                    </div>
                    <button onClick={() => setWelcomeVisible(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}

            {/* Sección de Estadísticas Dinámicas */}
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        <p className="text-white col-span-full text-center py-8">Cargando estadísticas...</p>
                    ) : error ? (
                        <div className="col-span-full bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-4 text-center">
                            {error}
                        </div>
                    ) : (
                        <>
                            <StatCard 
                                icon={faDollarSign} 
                                title="Ventas de Hoy" 
                                value={`$${stats.today_sales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            />
                            <StatCard 
                                icon={faUsers} 
                                title="Nuevos Clientes (Semana)" 
                                value={stats.new_customers_week}
                            />
                            <StatCard 
                                icon={faBoxOpen} 
                                title="Items con Stock Bajo" 
                                value={stats.low_stock_items}
                            />
                            {/* Placeholder para una futura estadística */}
                             <StatCard 
                                icon={faChartBar} 
                                title="Crecimiento" 
                                value="+15%"
                                isLoading={false}
                            />
                        </>
                    )}
                </div>
            </div>
            
            {/* Sección de Accesos Rápidos */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Accesos Rápidos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <ActionCard 
                        to="/jefe/control-stock" 
                        icon={faBoxOpen} 
                        title="Control Stock"
                        description="Consulta el stock actual de todos tus productos."
                    />
                    <ActionCard 
                        to="/jefe/stock" 
                        icon={faPlusCircle} 
                        title="Gestión de Stock"
                        description="Agrega y edita los productos de tu catálogo."
                    />
                    <ActionCard 
                        to="/jefe/customers" 
                        icon={faAddressBook} 
                        title="Clientes"
                        description="Administra tu base de datos de clientes."
                    />
                     <ActionCard 
                        to="/jefe/suppliers" 
                        icon={faTruck} 
                        title="Proveedores"
                        description="Gestiona la información de tus proveedores."
                    />
                    <ActionCard 
                        to="/jefe/caja" 
                        icon={faMoneyBillWave} 
                        title="Control de Caja"
                        description="Realiza arqueos, aperturas y cierres de caja."
                    />
                    <ActionCard 
                        to="/jefe/analysis" 
                        icon={faChartBar} 
                        title="Reportes"
                        description="Genera resúmenes de ventas y movimientos."
                    />
                    <ActionCard 
                        to="/jefe/settings" 
                        icon={faCog} 
                        title="Configuración"
                        description="Ajusta parámetros del sistema y usuarios."
                    />
                </div>
            </div>
        </div>
    );
};

export default JefeHome;
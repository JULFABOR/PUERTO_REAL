import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/jefe/StatCard.jsx';
import { SectionCard } from '@/components/Empleado';
import JefeHeader from '@/components/jefe/JefeHeader';import { 
    faBoxOpen, faPlusCircle, faAddressBook, faMoneyBillWave, faChartBar,
    faCog, faTruck, faUsers, faDollarSign
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



    return (
        <div className="space-y-10">
            <JefeHeader user={user} />

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
                    <SectionCard
                        to="/jefe/control-stock"
                        icon={<FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-3xl" />}
                        title="Control Stock"
                        description="Consulta el stock actual de todos tus productos."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                    <SectionCard
                        to="/jefe/stock"
                        icon={<FontAwesomeIcon icon={faPlusCircle} className="text-pr-yellow text-3xl" />}
                        title="Gestión de Stock"
                        description="Agrega y edita los productos de tu catálogo."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                    <SectionCard
                        to="/jefe/customers"
                        icon={<FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-3xl" />}
                        title="Clientes"
                        description="Administra tu base de datos de clientes."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                     <SectionCard
                        to="/jefe/suppliers"
                        icon={<FontAwesomeIcon icon={faTruck} className="text-pr-yellow text-3xl" />}
                        title="Proveedores"
                        description="Gestiona la información de tus proveedores."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                    <SectionCard
                        to="/jefe/caja"
                        icon={<FontAwesomeIcon icon={faMoneyBillWave} className="text-pr-yellow text-3xl" />}
                        title="Control de Caja"
                        description="Realiza arqueos, aperturas y cierres de caja."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                    <SectionCard
                        to="/jefe/analysis"
                        icon={<FontAwesomeIcon icon={faChartBar} className="text-pr-yellow text-3xl" />}
                        title="Reportes"
                        description="Genera resúmenes de ventas y movimientos."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                    <SectionCard
                        to="/jefe/settings"
                        icon={<FontAwesomeIcon icon={faCog} className="text-pr-yellow text-3xl" />}
                        title="Configuración"
                        description="Ajusta parámetros del sistema y usuarios."
                        iconWrapperClasses="bg-pr-dark-gray p-4 rounded-full mb-4"
                    />
                </div>
            </div>
        </div>
    );
};

export default JefeHome;
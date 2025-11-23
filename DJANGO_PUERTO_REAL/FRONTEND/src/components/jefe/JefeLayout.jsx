import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, faTimes, faBoxesStacked, faBookOpen, faUsers, faTruckField, 
    faMoneyBillWave, faChartPie, faSpinner, faCog, faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import { initFlowbite } from 'flowbite';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/shared/Footer';

const SidebarLink = ({ to, icon, children }) => (
    <li>
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded-lg transition-colors text-gray-300 hover:bg-pr-gray hover:text-white ${
                    isActive ? 'bg-pr-yellow text-pr-dark shadow-md' : ''
                }`
            }
        >
            <FontAwesomeIcon icon={icon} className="w-5 h-5 text-center" />
            <span className="font-medium">{children}</span>
        </NavLink>
    </li>
);

const JefeLayout = () => {
    const { user, logout, loading } = useAuth(); 
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            initFlowbite();
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-pr-dark-gray flex items-center justify-center">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-pr-yellow text-4xl mb-4" />
                    <p className="text-gray-300">Cargando sistema...</p>
                </div>
            </div>
        );
    }

    if (!loading && !user) {
        navigate('/');
        return null; // Evita renderizar nada si no hay usuario
    }

    return (
        <div className="min-h-screen bg-pr-dark-gray font-sans text-gray-300">
            {/* --- Sidebar --- */}
            <aside 
                className={`bg-pr-dark fixed top-0 left-0 z-40 w-64 h-screen p-6 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo y Título */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-24 h-24 bg-pr-yellow rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-pr-dark font-bold text-xl select-none">LOGO</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Puerto Real</h1>
                </div>

                {/* Navegación */}
                <nav className="flex-grow space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="font-semibold text-gray-400 text-sm mb-3 px-3">GESTIÓN</h3>
                        <ul className="space-y-2">
                            <SidebarLink to="/jefe/control-stock" icon={faBoxesStacked}>Control Stock</SidebarLink>
                            <SidebarLink to="/jefe/stock" icon={faBookOpen}>Stock</SidebarLink>
                            <SidebarLink to="/jefe/customers" icon={faUsers}>Clientes</SidebarLink>
                            <SidebarLink to="/jefe/suppliers" icon={faTruckField}>Proveedores</SidebarLink>
                            <SidebarLink to="/jefe/caja" icon={faMoneyBillWave}>Control de Caja</SidebarLink>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-400 text-sm mb-3 px-3">ANÁLISIS</h3>
                        <ul className="space-y-2">
                            <SidebarLink to="/jefe/analysis" icon={faChartPie}>Reportes</SidebarLink>
                        </ul>
                    </div>
                </nav>

                {/* Footer del Sidebar */}
                <div className="mt-6">
                    <ul className="space-y-2">
                        <SidebarLink to="/jefe/settings" icon={faCog}>Configuración</SidebarLink>
                        <li>
                            <button 
                                onClick={logout} 
                                className="flex items-center gap-4 p-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 text-center" />
                                <span className="font-medium">Cerrar Sesión</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>

            {/* Overlay para modo móvil */}
            {isSidebarOpen && <div className="bg-black/50 fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* --- Main Content --- */}
            <div className="md:ml-64 flex flex-col h-screen">
                {/* Header */}
                <header className="bg-pr-dark-gray/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between p-4 border-b border-pr-gray/20">
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)} 
                        className="p-2 text-gray-400 rounded-lg md:hidden hover:bg-pr-gray focus:outline-none"
                    >
                        <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} className="text-xl" />
                    </button>
                    <div className="flex-grow"></div> {/* Espaciador */}
                    
                    {/* User Menu */}
                    <div className="flex items-center">
                         <button type="button" className="flex items-center gap-3 text-sm rounded-full focus:ring-4 focus:ring-pr-yellow" id="user-menu-button" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                            <span className="sr-only">Abrir menú de usuario</span>
                            <img className="w-9 h-9 rounded-full object-cover" src="https://placehold.co/40x40/FFC700/121212?text=J" alt="foto de usuario" />
                            <div className="hidden md:flex flex-col items-start">
                                <span className="font-medium text-white">{user?.username || 'Usuario'}</span>
                                <span className="text-xs text-gray-400">{user?.rol || 'Jefe'}</span>
                            </div>
                        </button>
                        <div className="z-50 hidden my-4 text-base list-none bg-pr-dark divide-y divide-gray-600 rounded-lg shadow" id="user-dropdown">
                            <div className="px-4 py-3">
                                <span className="block text-sm text-white">{user?.username || 'Usuario'}</span>
                                <span className="block text-sm text-gray-400 truncate">{user?.email || 'email@ejemplo.com'}</span>
                            </div>
                            <ul className="py-1" aria-labelledby="user-menu-button">
                                <li>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-pr-gray hover:text-red-300 md:hidden">
                                        Cerrar Sesión
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
                
                <Footer />
            </div>
        </div>
    );
};

export default JefeLayout;
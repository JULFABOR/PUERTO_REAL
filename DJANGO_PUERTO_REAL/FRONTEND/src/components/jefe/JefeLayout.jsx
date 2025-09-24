import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, 
    faBoxesStacked, 
    faBookOpen, 
    faUsers, 
    faTruckField, 
    faMoneyBillWave,
    faChartPie,
    faHome
} from '@fortawesome/free-solid-svg-icons';
import { initFlowbite } from 'flowbite';

const getUserData = () => {
    try {
        const userDataString = localStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
        console.error("Error parsing user data from localStorage", error);
        return null;
    }
};

const JefeLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false); // Hidden by default on mobile
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        initFlowbite();
        setUserData(getUserData());
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        navigate('/');
    };

    return (
        <div className="bg-pr-dark-gray font-sans text-gray-300 min-h-screen">
            <nav className="bg-pr-dark border-b border-pr-gray/20 fixed w-full z-20 top-0 start-0">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link to="/jefe/home" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className="self-center text-2xl font-bold whitespace-nowrap text-pr-yellow">PUERTO REAL</span>
                    </Link>
                    <div className="flex items-center md:order-2 space-x-3 rtl:space-x-reverse">
                        <button onClick={toggleSidebar} type="button" className="p-2 text-sm text-gray-400 rounded-lg md:hidden hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600">
                            <span className="sr-only">Toggle sidebar</span>
                            <FontAwesomeIcon icon={faBars} className="text-xl" />
                        </button>
                        <button type="button" className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-pr-yellow" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                            <span className="sr-only">Abrir menú de usuario</span>
                            <img className="w-8 h-8 rounded-full" src="https://placehold.co/40x40/FFC700/121212?text=J" alt="foto de usuario" />
                        </button>
                        <div className="z-50 hidden my-4 text-base list-none bg-pr-dark divide-y divide-gray-600 rounded-lg shadow" id="user-dropdown">
                            <div className="px-4 py-3">
                                <span className="block text-sm text-white">{userData?.rol || 'Jefe'}</span>
                                <span className="block text-sm text-gray-400 truncate">{userData?.email || ''}</span>
                            </div>
                            <ul className="py-2" aria-labelledby="user-menu-button">
                                <li><button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-pr-dark-gray">Cerrar Sesión</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex mt-16">
                <aside id="sidebar-jefe" className={`fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-pr-dark p-4 space-y-6 shrink-0 transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div>
                        <h3 className="font-bold text-white text-lg mb-4">Gestión de Tienda</h3>
                        <ul className="space-y-2">
                            <li><Link to="/jefe/home" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faHome} className="w-5 text-center text-lg" /> Home</Link></li>
                            <li><Link to="/jefe/control-stock" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faBoxesStacked} className="w-5 text-center text-lg" /> Control Stock</Link></li>
                            <li><Link to="/jefe/stock" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faBookOpen} className="w-5 text-center text-lg" /> Stock</Link></li>
                            <li><Link to="/jefe/clientes" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faUsers} className="w-5 text-center text-lg" /> Clientes</Link></li>
                            <li><Link to="/jefe/proveedores" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faTruckField} className="w-5 text-center text-lg" /> Proveedores</Link></li>
                            <li><Link to="/jefe/caja" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faMoneyBillWave} className="w-5 text-center text-lg" /> Control de Caja</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg mb-4">Análisis</h3>
                        <ul className="space-y-2">
                            <li><Link to="/jefe/analysis" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faChartPie} className="w-5 text-center text-lg" /> Reportes de Venta</Link></li>
                        </ul>
                    </div>
                </aside>

                {isSidebarOpen && <div className="bg-gray-900/50 fixed inset-0 z-30 md:hidden" onClick={toggleSidebar}></div>}

                <main id="main-content" className="flex-1 p-6 lg:p-8 transition-all duration-300 md:ml-64">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default JefeLayout;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, faBoxesStacked, faBookOpen, faUsers, faTruckField, faMoneyBillWave, 
    faChartPie 
} from '@fortawesome/free-solid-svg-icons';
import { initFlowbite } from 'flowbite';

// Helper para obtener datos de usuario de forma segura
const getUserData = () => {
    try {
        const userDataString = localStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
        console.error("Error parsing user data from localStorage", error);
        return null;
    }
};

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
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

    const renderManagerLinks = () => (
        <>
            <div>
                <h3 className="font-bold text-white text-lg mb-4">Gestión de Tienda</h3>
                <ul className="space-y-2">
                    <li><Link to="/control-stock" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faBoxesStacked} className="w-5 text-center text-lg" /> Control Stock</Link></li>
                    <li><Link to="#" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faBookOpen} className="w-5 text-center text-lg" /> Stock</Link></li>
                    <li><Link to="#" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faUsers} className="w-5 text-center text-lg" /> Clientes</Link></li>
                    <li><Link to="#" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faTruckField} className="w-5 text-center text-lg" /> Proveedores</Link></li>
                    <li><Link to="#" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faMoneyBillWave} className="w-5 text-center text-lg" /> Control de Caja</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-white text-lg mb-4">Análisis</h3>
                <ul className="space-y-2">
                    <li><Link to="#" className="flex items-center gap-3 text-gray-300 hover:text-pr-yellow py-2 px-3 rounded-lg hover:bg-pr-dark-gray transition-colors"><FontAwesomeIcon icon={faChartPie} className="w-5 text-center text-lg" /> Reportes de Venta</Link></li>
                </ul>
            </div>
        </>
    );

    // Aquí se podrían añadir funciones para renderizar otros menús, ej. renderEmployeeLinks, renderClientLinks

    return (
        <div className="bg-pr-dark-gray font-sans text-gray-300 min-h-screen">
            <nav className="bg-pr-dark border-b border-pr-gray/20 fixed w-full z-30 top-0 start-0">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link to="/home" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className="self-center text-2xl font-bold whitespace-nowrap text-pr-yellow">PUERTO REAL</span>
                    </Link>
                    <div className="flex items-center md:order-2 space-x-3 rtl:space-x-reverse">
                        <button onClick={toggleSidebar} type="button" className="p-2 text-sm text-gray-400 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600">
                            <FontAwesomeIcon icon={faBars} className="text-xl" />
                        </button>
                        <button type="button" className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-pr-yellow" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                            <span className="sr-only">Abrir menú de usuario</span>
                            <img className="w-8 h-8 rounded-full" src="https://placehold.co/40x40/FFC700/121212?text=G" alt="foto de usuario" />
                        </button>
                        <div className="z-50 hidden my-4 text-base list-none bg-pr-dark divide-y divide-gray-600 rounded-lg shadow" id="user-dropdown">
                            <div className="px-4 py-3">
                                <span className="block text-sm text-white">{userData?.rol || 'Usuario'}</span>
                                <span className="block text-sm text-gray-400 truncate">{userData?.email || ''}</span>
                            </div>
                            <ul className="py-2" aria-labelledby="user-menu-button">
                                <li><Link to="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-pr-dark-gray">Configuración</Link></li>
                                <li><button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-pr-dark-gray">Cerrar Sesión</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex pt-16">
                <aside id="sidebar" className={`fixed top-0 left-0 z-20 w-64 h-screen pt-16 bg-pr-dark p-4 space-y-6 shrink-0 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Renderizado condicional de menú según el rol */}
                    {userData?.rol === 'Gerente de Tienda' && renderManagerLinks()}
                    {/* {userData?.rol === 'Empleado' && renderEmployeeLinks()} */}
                    {/* {userData?.rol === 'Cliente' && renderClientLinks()} */}
                </aside>

                {isSidebarOpen && <div className="bg-gray-900/50 fixed inset-0 z-30 md:hidden" onClick={toggleSidebar}></div>}

                <main className={`flex-1 p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                    {children} { /* Aquí se renderizará el contenido de cada página */ }
                </main>
            </div>
        </div>
    );
};

export default Layout;

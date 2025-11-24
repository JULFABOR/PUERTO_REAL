import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faBookOpen, faUser, faSignOutAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import { initFlowbite } from 'flowbite';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/shared/Footer';
import { useSearch } from '@/contexts/SearchContext'; // Import useSearch

// Componente reutilizable para los enlaces del Header
const HeaderLink = ({ to, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `block py-2 px-3 rounded transition-colors ${
                isActive 
                ? 'text-pr-yellow bg-pr-gray md:bg-transparent md:text-pr-yellow' 
                : 'text-gray-300 hover:bg-pr-gray md:hover:bg-transparent md:hover:text-pr-yellow'
            }`
        }
    >
        {children}
    </NavLink>
);


const ClienteLayout = () => {
    const { user, logout, loading } = useAuth();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const { searchTerm, handleSearchInputChange, triggerSearchFromInput } = useSearch(); // Use search context
    const navigate = useNavigate();

    useEffect(() => {
        initFlowbite();
    }, []);

     // Redirige si no hay usuario después de cargar
     useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [loading, user, navigate]);

    const triggerSearch = (event) => {
        if (event.key === 'Enter') {
            triggerSearchFromInput(searchTerm);
        }
    };

    // Muestra un spinner mientras carga la información del usuario
    if (loading) {
        return (
            <div className="min-h-screen bg-pr-dark-gray flex items-center justify-center">
                 <p className="text-gray-300">Cargando tu espacio...</p>
            </div>
        );
    }

    return (
        <div className="bg-pr-dark-gray font-sans text-gray-300 min-h-screen flex flex-col">
            
            {/* --- Header / Top Navigation --- */}
            <header className="bg-pr-dark/90 backdrop-blur-sm sticky top-0 w-full z-30 border-b border-pr-gray/20">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    {/* Logo y Título */}
                    <NavLink to="/cliente/home" className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pr-yellow rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-pr-dark font-bold text-lg select-none">LOGO</span>
                        </div>                        <span className="self-center text-2xl font-bold whitespace-nowrap text-white">Puerto Real</span>
                    </NavLink>

                    {/* Botón de Menú Móvil y Menú de Usuario */}
                    <div className="flex items-center md:order-2 gap-3">
                        {/* User Menu */}
                        <button type="button" className="flex text-sm bg-pr-dark-gray rounded-full focus:ring-4 focus:ring-pr-yellow" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                            <span className="sr-only">Abrir menú de usuario</span>
                            <img className="w-9 h-9 rounded-full object-cover" src="https://placehold.co/40x40/FFC700/121212?text=U" alt="foto de usuario" />
                        </button>
                        <div className="z-50 hidden my-4 text-base list-none bg-pr-dark divide-y divide-gray-600 rounded-lg shadow" id="user-dropdown">
                            <div className="px-4 py-3">
                                <span className="block text-sm text-white">{user?.username || 'Cliente'}</span>
                                <span className="block text-sm text-gray-400 truncate">{user?.email || 'email@ejemplo.com'}</span>
                            </div>
                            <ul className="py-1" aria-labelledby="user-menu-button">
                                <li>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                        Cerrar Sesión
                                    </button>
                                </li>
                            </ul>
                        </div>
                        {/* Mobile Menu Button */}
                        <button onClick={() => setMenuOpen(!isMenuOpen)} type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-pr-yellow rounded-lg md:hidden hover:bg-pr-gray focus:outline-none focus:ring-2 focus:ring-pr-yellow" aria-controls="navbar-user" aria-expanded={isMenuOpen}>
                            <span className="sr-only">Abrir menú principal</span>
                            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="text-xl" />
                        </button>                    </div>

                    {/* Enlaces de Navegación */}
                    <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${isMenuOpen ? 'block' : 'hidden'}`} id="navbar-user">
                        <div className="relative mt-4 md:mt-0 md:mr-4 flex-grow"> {/* Added flex-grow for desktop search bar */}
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                id="search-navbar"
                                className="block w-full p-2 pl-10 text-sm text-white border border-pr-gray rounded-lg bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={handleSearchInputChange}
                                onKeyPress={triggerSearch}
                            />
                        </div>
                        <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-pr-gray rounded-lg bg-pr-dark md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
                            <li>
                                <HeaderLink to="/cliente/home">Productos</HeaderLink>
                            </li>
                            <li>
                                <HeaderLink to="/cliente/promociones">Promociones</HeaderLink>
                            </li>
                            {/* <li>
                                <HeaderLink to="/cliente/perfil">Mi Perfil</HeaderLink>
                            </li> */}
                        </ul>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-grow w-full max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default ClienteLayout;
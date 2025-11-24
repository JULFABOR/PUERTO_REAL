// src/components/common/Navbar.jsx
import { Navbar } from 'flowbite-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const NavLinkItem = ({ to, children }) => (
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

export default function CommonNavbar({ navLinks = [] }) {
  const { logout } = useAuth();

  return (
    <Navbar fluid rounded className="bg-pr-dark-gray">
      <Navbar.Brand as={NavLink} to="/home">
        <div className="w-12 h-12 bg-pr-yellow rounded-full flex items-center justify-center shadow-lg mr-3">
            <img src="/logo1-removebg-preview.png" alt="Puerto Real Logo" className="h-full w-full object-contain" />
        </div>
        <span className="self-center whitespace-nowrap text-xl font-semibold text-white">
          Puerto Real
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <button 
            type="button" 
            onClick={logout}
            className="text-white bg-pr-red hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          Cerrar Sesión
        </button>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        {navLinks.map((link, index) => (
            <NavLinkItem key={index} to={link.to}>{link.label}</NavLinkItem>
        ))}
      </Navbar.Collapse>
    </Navbar>
  );
}

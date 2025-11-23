// src/components/common/Navbar.jsx
import { Navbar, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';

export default function AppNavbar() {
  return (
    <Navbar fluid rounded className="bg-pr-dark-gray">
      <Navbar.Brand as={Link} to="/home">
        <img src="/logo1-removebg-preview.png" className="mr-3 h-6 sm:h-9" alt="Puerto Real Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-white">
          Puerto Real
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Button color="failure">
          Cerrar Sesión
        </Button>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        <Navbar.Link as={Link} to="/home" active className="text-white">
          Inicio
        </Navbar.Link>
        <Navbar.Link as={Link} to="#" className="text-gray-300 hover:text-pr-yellow">
          Opción 1
        </Navbar.Link>
        <Navbar.Link as={Link} to="#" className="text-gray-300 hover:text-pr-yellow">
          Opción 2
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-gray-400">
          &copy; {currentYear} Puerto Real. Todos los derechos reservados.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Una solución de software para la gestión de tu negocio.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

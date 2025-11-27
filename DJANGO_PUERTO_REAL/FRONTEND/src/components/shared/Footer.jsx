import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Building, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const { storeSettings } = useStore();
  const currentYear = new Date().getFullYear();

  // Fallback values if settings are not loaded
  const { nombre_tienda = 'Puerto Real', direccion, telefono } = storeSettings || {};

  return (
    <footer className="bg-pr-dark-gray text-white p-6 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        {/* Columna 1: Nombre y Copyright */}
        <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5 text-pr-yellow" />
                <span className="font-bold text-lg">{nombre_tienda}</span>
            </div>
            <p className="text-sm text-gray-400">
                &copy; {currentYear} {nombre_tienda}. Todos los derechos reservados.
            </p>
        </div>

        {/* Columna 2: Información de Contacto */}
        <div className="flex flex-col items-center md:items-start gap-2 text-sm text-gray-300">
            {direccion && (
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-pr-yellow" />
                    <span>{direccion}</span>
                </div>
            )}
            {telefono && (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-pr-yellow" />
                    <span>{telefono}</span>
                </div>
            )}
        </div>
        
        {/* Columna 3: Agradecimiento o Mensaje Adicional */}
        <div className="flex items-center justify-center md:justify-end">
             <p className="text-xs text-gray-500 italic">
                Una solución de software para la gestión de tu negocio.
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

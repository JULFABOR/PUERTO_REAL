import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faUser,
    faBuilding,
    faIdCard,
    faPhone,
    faEnvelope,
    faCircle,
} from '@fortawesome/free-solid-svg-icons';

// Componente para el Badge de Estado
const StatusBadge = ({ isActivo }) => (
    <span
        className={`
            inline-flex items-center px-3 py-0.5 rounded-full text-sm font-bold
            ${isActivo 
                ? 'bg-green-600/20 text-green-300' 
                : 'bg-red-600/20 text-red-300'
            }
        `}
    >
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-2" />
        {isActivo ? 'Activo' : 'Inactivo'}
    </span>
);

// Componente para cada fila de detalle
const DetailItem = ({ icon, label, children }) => (
    <div>
        <dt className="flex items-center text-sm font-medium text-pr-gray/80 uppercase tracking-wider">
            <FontAwesomeIcon icon={icon} className="w-4 h-4 mr-3" />
            {label}
        </dt>
        <dd className="mt-1 text-lg font-semibold text-white ml-7">
            {children}
        </dd>
    </div>
);

// --- Componente Principal del Modal ---
const ProviderDetailsModal = ({ isOpen, onClose, provider }) => {
    if (!isOpen || !provider) return null;

    // Lógica del estado (basada en tu código original)
    const isActivo = provider.estado_proveedor === 7;

    return (
        <div
            className={`
                fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full 
                bg-black bg-opacity-70 transition-opacity duration-300
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            onClick={onClose} // Cierra el modal al hacer clic en el fondo
        >
            <div
                className={`
                    relative p-0 w-full max-w-lg transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()} // Evita que el clic en el modal cierre el modal
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    {/* --- Encabezado --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Detalles del Proveedor</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                        </button>
                    </div>

                    {/* --- Cuerpo con Detalles --- */}
                    <div className="p-4 md:p-6 space-y-5">
                        <dl className="space-y-5">
                            <DetailItem icon={faUser} label="Nombre">
                                {provider.nombre_proveedor}
                            </DetailItem>
                            
                            <DetailItem icon={faBuilding} label="Razón Social">
                                {provider.razon_social_proveedor || <span className="text-pr-gray/70">N/A</span>}
                            </DetailItem>

                            <DetailItem icon={faIdCard} label="CUIT">
                                {provider.cuit_proveedor}
                            </DetailItem>

                            <DetailItem icon={faPhone} label="Teléfono">
                                {provider.telefono_proveedor ? (
                                    <a href={`tel:${provider.telefono_proveedor}`} className="text-pr-yellow hover:underline">
                                        {provider.telefono_proveedor}
                                    </a>
                                ) : (
                                    <span className="text-pr-gray/70">N/A</span>
                                )}
                            </DetailItem>

                            <DetailItem icon={faEnvelope} label="Correo Electrónico">
                                {provider.correo_proveedor ? (
                                    <a href={`mailto:${provider.correo_proveedor}`} className="text-pr-yellow hover:underline">
                                        {provider.correo_proveedor}
                                    </a>
                                ) : (
                                    <span className="text-pr-gray/70">N/A</span>
                                )}
                            </DetailItem>
                            
                            <DetailItem icon={isActivo ? faCircle : faCircle} label="Estado">
                                <StatusBadge isActivo={isActivo} />
                            </DetailItem>
                        </dl>
                    </div>

                    {/* --- Pie de Página (Footer) --- */}
                    <div className="flex items-center justify-end p-4 md:p-5 border-t border-gray-600 rounded-b">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-auto text-pr-dark bg-pr-gray hover:bg-pr-gray/80 font-bold rounded-lg text-sm px-5 py-2.5 text-center"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDetailsModal;
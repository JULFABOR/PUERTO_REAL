import React from 'react';

const ProviderDetailsModal = ({ isOpen, onClose, provider }) => {
    if (!isOpen || !provider) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Detalles del Proveedor</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div className="p-4 md:p-5 space-y-4">
                        <div>
                            <h4 className="font-bold text-white">Nombre:</h4>
                            <p className="text-pr-gray">{provider.nombre_proveedor}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Razón Social:</h4>
                            <p className="text-pr-gray">{provider.razon_social_proveedor}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">CUIT:</h4>
                            <p className="text-pr-gray">{provider.cuit_proveedor}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Teléfono:</h4>
                            <p className="text-pr-gray">{provider.telefono_proveedor}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Correo Electrónico:</h4>
                            <p className="text-pr-gray">{provider.correo_proveedor}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Estado:</h4>
                            <p className="text-pr-gray">{provider.estado_proveedor === 30 ? 'Activo' : 'Inactivo'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDetailsModal;

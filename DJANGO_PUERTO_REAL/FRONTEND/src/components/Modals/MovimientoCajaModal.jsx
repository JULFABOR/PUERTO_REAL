import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// No se necesita toast ni apiClient, el hook se encarga.

const MovimientoCajaModal = ({ 
    isOpen, 
    onClose, 
    // onSuccess, <-- ELIMINADO
    tipoMovimiento, 
    registerMovement, 
    isSubmitting     
}) => {
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');

    const isIngreso = tipoMovimiento === 'INGRESO';
    const title = isIngreso ? 'Registrar Ingreso Manual' : 'Registrar Egreso Manual';
    const buttonColor = isIngreso ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    useEffect(() => {
        if (isOpen) {
            setMonto('');
            setMotivo('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Llama a la función del hook
        const success = await registerMovement(monto, motivo, tipoMovimiento);

        if (success) {
            // 2. 'onSuccess()' se eliminó.
            
            // 3. Cierra el modal. ¡Esto es todo!
            onClose(); 
        }
        // Si 'success' es false, el hook ya mostró un toast de error
        // y el modal simplemente se queda abierto.
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-md">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">{title}</h3>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting} // Controlado por el hook
                            className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"
                        >
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                        </button>
                    </div>
                    <form className="p-4 md:p-5" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <input
                                type="number"
                                step="0.01"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="Monto"
                                className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                required
                                disabled={isSubmitting} // Controlado por el hook
                            />
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Motivo (Ej: Pago a proveedor, Retiro de gerencia)"
                                className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                rows="3"
                                required
                                disabled={isSubmitting} // Controlado por el hook
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} // Controlado por el hook
                            className={`w-full mt-4 text-white ${buttonColor} font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-700 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? 'Registrando...' : 'Confirmar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

MovimientoCajaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tipoMovimiento: PropTypes.oneOf(['INGRESO', 'EGRESO']).isRequired,
    registerMovement: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

export default MovimientoCajaModal;
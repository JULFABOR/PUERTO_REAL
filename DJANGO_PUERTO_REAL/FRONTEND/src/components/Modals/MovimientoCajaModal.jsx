import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const MovimientoCajaModal = ({ isOpen, onClose, onSuccess, tipoMovimiento }) => {
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isIngreso = tipoMovimiento === 'INGRESO';
    const title = isIngreso ? 'Registrar Ingreso Manual' : 'Registrar Egreso Manual';
    const buttonColor = isIngreso ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return toast.error("El monto debe ser un número positivo.");
        }
        if (!motivo.trim()) {
            return toast.error("Debe ingresar un motivo.");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Registrando movimiento...');

        try {
            // Este es el NUEVO endpoint que debes crear en Django
            await apiClient('/api/caja/movimiento/', {
                method: 'POST',
                body: JSON.stringify({
                    monto: montoNum,
                    motivo: motivo,
                    tipo: tipoMovimiento // 'INGRESO' o 'EGRESO'
                }),
            });
            toast.success('¡Movimiento registrado!', { id: loadingToast });
            setMonto('');
            setMotivo('');
            onSuccess(); // Refresca los datos en la página de Caja
            onClose();   // Cierra este modal
        } catch (err) {
            toast.error(err.message || 'No se pudo registrar el movimiento.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-md">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">{title}</h3>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
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
                            />
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Motivo (Ej: Pago a proveedor, Retiro de gerencia)"
                                className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                rows="3"
                                required
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
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
    onSuccess: PropTypes.func.isRequired,
    tipoMovimiento: PropTypes.oneOf(['INGRESO', 'EGRESO']).isRequired,
};

export default MovimientoCajaModal;
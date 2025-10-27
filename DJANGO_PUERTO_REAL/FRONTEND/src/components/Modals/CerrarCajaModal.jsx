import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import apiClient from  '@/api/apiClient'; // Ajusta esta ruta si es necesario

const CerrarCajaModal = ({ isOpen, onClose, onSuccess, cajaEstado }) => {
    const [montoCierreReal, setMontoCierreReal] = useState('');
    const [observacionesCierre, setObservacionesCierre] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        
        const monto = parseFloat(montoCierreReal);
        if (isNaN(monto) || monto <= 0) {
            return toast.error("Por favor, ingrese un monto de cierre válido y positivo.");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Cerrando caja...');

        try {
            await apiClient('/api/caja/cerrar/', {
                method: 'POST',
                body: JSON.stringify({
                    monto_cierre_real: montoCierreReal,
                    observaciones_cierre: observacionesCierre
                }),
            });
            toast.success('¡Caja cerrada con éxito!', { id: loadingToast });
            setMontoCierreReal('');
            setObservacionesCierre('');
            onSuccess(); // Refresca los datos en la página principal
            onClose();   // Cierra este modal
        } catch (err) {
            toast.error(err.message || 'No se pudo cerrar la caja.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Calculamos la diferencia
    const teorico = parseFloat(cajaEstado?.monto_teorico_caja || 0);
    const real = parseFloat(montoCierreReal) || 0;
    const diferencia = real - teorico;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Confirmar Cierre de Caja</h3>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <form className="p-4 md:p-5" onSubmit={handleCerrarCaja}>
                        <div className="space-y-4">
                            {/* Resumen de Cierre */}
                            <div className="grid grid-cols-2 gap-4 text-white">
                                <div className="bg-pr-dark-gray p-4 rounded-lg text-center">
                                    <span className="text-sm text-gray-400">Saldo Teórico</span>
                                    <p className="text-2xl font-bold">${teorico.toFixed(2)}</p>
                                </div>
                                <div className={`bg-pr-dark-gray p-4 rounded-lg text-center ${diferencia < 0 ? 'border border-red-500' : 'border border-transparent'}`}>
                                    <span className="text-sm text-gray-400">Diferencia</span>
                                    <p className={`text-2xl font-bold ${diferencia === 0 ? 'text-white' : diferencia > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ${diferencia.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Inputs del Formulario */}
                            <input
                                type="number"
                                step="0.01"
                                value={montoCierreReal}
                                onChange={(e) => setMontoCierreReal(e.target.value)}
                                placeholder="Monto de cierre (real)"
                                className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                required
                            />
                            <textarea
                                value={observacionesCierre}
                                onChange={(e) => setObservacionesCierre(e.target.value)}
                                placeholder="Observaciones de cierre (opcional)"
                                className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                rows="3"
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full mt-4 text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-700 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

CerrarCajaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    cajaEstado: PropTypes.object, // Pasamos el estado de la caja para el resumen
};

export default CerrarCajaModal;
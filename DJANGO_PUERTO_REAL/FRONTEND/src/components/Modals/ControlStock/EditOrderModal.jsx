import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // <-- Añadido para validación de props
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

const EditOrderModal = ({ isOpen, onClose, onSuccess, order, orderStates }) => {
    const [selectedStateId, setSelectedStateId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carga el estado actual de la orden cuando el modal se abre
    useEffect(() => {
        if (order) {
            setSelectedStateId(order.estado_compra.id_estado);
        }
    }, [order, isOpen]); // Añadido isOpen para resetear si el prop 'order' cambia

    // --- CAMBIOS EN handleSubmit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!order || !selectedStateId) return;

        setIsSubmitting(true);
        
        try {
            // --- CAMBIO 1: Sintaxis de Axios PATCH ---
            // Antes: await apiClient(url, { method: 'PATCH', body: ... })
            // Ahora: apiClient.patch(ruta_sin_api, payload)
            await apiClient.patch(
                `/compras/compras/${order.id_compra}/`, 
                { estado_compra: Number(selectedStateId) } // Pasamos el payload directamente
            );
            
            toast.success('¡Estado de la orden actualizado!');
            onSuccess(); // Refresca la tabla de órdenes
            onClose();   // Cierra el modal
        
        } catch (error) {
            // --- CAMBIO 2: Manejo de errores de Axios ---
            // Antes: toast.error(error.data?.detail ...)
            // Ahora:
            const errorMsg = error.response?.data?.detail || 'No se pudo actualizar la orden.';
            toast.error(errorMsg);
        
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

    // --- RENDERIZADO (Sin cambios) ---
    return (
        <div
            className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`relative p-0 w-full max-w-md transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">
                            Editar Estado (Orden #{order.id_compra})
                        </h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <form className="p-4 md:p-5" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="estado_compra" className="block mb-2 text-sm font-medium text-white">
                                Seleccionar nuevo estado
                            </label>
                            <select
                                id="estado_compra"
                                value={selectedStateId}
                                onChange={(e) => setSelectedStateId(e.target.value)}
                                className="p-2.5 w-full text-sm text-white border border-gray-500 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow"
                            >
                                <option value="" disabled>Selecciona un estado...</option>
                                {(orderStates || []).map(state => (
                                    <option key={state.id_estado} value={state.id_estado}>
                                        {state.nombre_estado}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-end space-x-4">
                            <button 
                                type="button" 
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="text-gray-400 hover:text-white px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700 disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : (
                                    'Guardar'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Añadido PropTypes ---
EditOrderModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    order: PropTypes.object,
    orderStates: PropTypes.array,
};

EditOrderModal.defaultProps = {
    order: null,
    orderStates: []
};

export default EditOrderModal;
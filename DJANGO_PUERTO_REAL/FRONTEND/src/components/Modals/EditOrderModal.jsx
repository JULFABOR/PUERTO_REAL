import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';
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
    }, [order]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!order || !selectedStateId) return;

        setIsSubmitting(true);
        
        try {
            await apiClient(`/api/compras/compras/${order.id_compra}/`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    estado_compra: Number(selectedStateId) // Envía el nuevo ID
                })
            });
            toast.success('¡Estado de la orden actualizado!');
            onSuccess(); // Refresca la tabla de órdenes
            onClose();   // Cierra el modal
        } catch (error) {
            toast.error(error.data?.detail || 'No se pudo actualizar la orden.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

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

export default EditOrderModal;
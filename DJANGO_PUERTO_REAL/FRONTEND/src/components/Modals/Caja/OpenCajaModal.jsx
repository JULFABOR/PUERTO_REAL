// src/components/caja/OpenCashModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FormInput from '@/components/shared/FormInput'; // Importamos nuestro input
import { toast } from 'react-hot-toast';

const OpenCajaModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [amount, setAmount] = useState('');

    // Limpia el input cuando el modal se abre
    useEffect(() => {
        if (isOpen) {
            setAmount('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // La validación principal ahora la hace el hook, 
        // pero podemos pasar el dato limpio.
        onSubmit(amount); 
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70 transition-opacity duration-300" 
            onClick={onClose}
        >
            <div 
                className="relative p-0 w-full max-w-md transition-all duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    <div className="flex items-center justify-between p-4 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Abrir Caja</h3>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"
                        >
                            <FontAwesomeIcon icon={faTimes}/>
                        </button>
                    </div>
                    <form className="p-4 space-y-6" onSubmit={handleSubmit}>
                        <FormInput
                            name="initial_balance"
                            label="Saldo Inicial en Efectivo"
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end space-x-3 border-t border-gray-600 pt-4">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isSubmitting} 
                                className="text-gray-400 hover:text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || amount === ''} 
                                className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[150px] flex justify-center items-center"
                            >
                                {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : 'Confirmar Apertura'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

OpenCajaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

export default OpenCajaModal;
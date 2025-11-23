import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types'; // <-- Añadido para validación de props
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// --- Componente de Input Reutilizable (Sin cambios) ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false }) => (
    <div className="relative z-0 w-full">
        <input
            type={type}
            name={name}
            id={`adjust_${name}`}
            value={value}
            onChange={onChange}
            required={required}
            autoComplete="off"
            className={`
                block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border 
                rounded-lg appearance-none focus:outline-none focus:ring-0
                ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-pr-yellow'}
                peer
            `}
            placeholder=" " 
        />
        <label
            htmlFor={`adjust_${name}`}
            className={`
                absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0]
                left-2.5 text-gray-400 peer-placeholder-shown:scale-100 
                peer-placeholder-shown:translate-y-0 peer-focus:scale-75 
                peer-focus:-translate-y-4 peer-focus:text-pr-yellow
            `}
        >
            {label}{required && ' *'}
        </label>
        {error && <p className="mt-1 text-xs text-red-400">{error[0]}</p>}
    </div>
);

const initialAdjustStockState = { searchTerm: '', selectedProduct: null, quantity: '', reason: '' };

const AdjustStockModal = ({ isOpen, onClose, onSuccess, allProducts, userData }) => {
    const [adjustStockState, setAdjustStockState] = useState(initialAdjustStockState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Resetea el formulario cuando el modal se cierra (Sin cambios)
    useEffect(() => {
        if (!isOpen) {
            setAdjustStockState(initialAdjustStockState);
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // --- Handlers y Memos (Sin cambios) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setAdjustStockState(prev => ({ 
            ...prev, 
            [name]: value, 
            ...(name === 'searchTerm' && { selectedProduct: null }) 
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSelectProduct = (product) => {
        setAdjustStockState(prev => ({ 
            ...prev, 
            selectedProduct: product, 
            searchTerm: `${product.nombre_producto} (SKU: ${product.barcode})` 
        }));
    };
    
    const filteredSearch = useMemo(() => {
        if (!adjustStockState.searchTerm) return [];
        const searchLower = adjustStockState.searchTerm.toLowerCase();
        return allProducts.filter(p => 
            p.nombre_producto.toLowerCase().includes(searchLower) || 
            (p.barcode && p.barcode.includes(searchLower))
        ).slice(0, 5);
    }, [allProducts, adjustStockState.searchTerm]);

    // --- CAMBIOS EN handleSubmit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!adjustStockState.selectedProduct || !adjustStockState.quantity || !adjustStockState.reason) {
            return toast.error("Debes seleccionar producto, cantidad y motivo.");
        }
        if (!userData || !userData.empleado_id) {
            return toast.error("No se pudo identificar al empleado. Por favor, inicie sesión de nuevo.");
        }
        
        setIsSubmitting(true);
        const payload = {
            product_id: adjustStockState.selectedProduct.id_producto,
            quantity: parseInt(adjustStockState.quantity, 10),
            reason: adjustStockState.reason,
            movement_type: 'MOV_STOCK_AJUSTE', // Hardcoded
            employee: userData.empleado_id,
        };
        
        try {
            // --- CAMBIO 1: Sintaxis de Axios POST ---
            // Antes: await apiClient('/api/stock/stock/adjust/', { method: 'POST', body: ... })
            // Ahora:
            await apiClient.post('/stock/stock/adjust/', payload);
            
            toast.success('¡Stock ajustado correctamente!');
            onSuccess(); // Llama al success handler del padre
        
        } catch (error) {
            // --- CAMBIO 2: Manejo de errores de Axios ---
            // Antes: if (error.data && ...)
            // Ahora:
            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                toast.error('Corrige los errores del formulario.');
            } else {
                toast.error(errorData?.detail || 'No se pudo ajustar el stock.');
            }
        
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERIZADO (Sin cambios) ---
    return (
        <div 
            className={`
                fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full 
                bg-black bg-opacity-70 transition-opacity duration-300
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            onClick={onClose}
        >
            <div 
                className={`
                    relative p-4 w-full max-w-md transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Ajustar Stock de Inventario</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <form className="p-4 md:p-5" onSubmit={handleSubmit}>
                        <div className="space-y-6 mb-6">
                            <div className="relative">
                                <FormInput
                                    name="searchTerm"
                                    label="Buscar Producto (Nombre o SKU)"
                                    value={adjustStockState.searchTerm}
                                    onChange={handleChange}
                                    error={errors.product_id}
                                    required
                                />
                                {filteredSearch.length > 0 && !adjustStockState.selectedProduct && (
                                    <div className="absolute z-10 w-full mt-1 bg-pr-dark-gray border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        <ul>
                                            {filteredSearch.map(p => (
                                                <li key={p.id_producto} className="p-3 text-white hover:bg-gray-700 cursor-pointer text-sm" onClick={() => handleSelectProduct(p)}>
                                                    {p.nombre_producto}
                                                    <span className="block text-xs text-pr-gray/70">SKU: {p.barcode}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <FormInput
                                type="number"
                                name="quantity"
                                label="Cantidad a Ajustar (+/-)"
                                value={adjustStockState.quantity}
                                onChange={handleChange}
                                error={errors.quantity}
                                required
                            />
                            <FormInput
                                name="reason"
                                label="Motivo del Ajuste"
                                value={adjustStockState.reason}
                                onChange={handleChange}
                                error={errors.reason}
                                required
                            />
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
                                className="w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700 disabled:opacity-70 flex items-center justify-center min-w-[170px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                        Ajustando...
                                    </>
                                ) : (
                                    'Confirmar Ajuste'
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
AdjustStockModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    allProducts: PropTypes.array.isRequired,
    userData: PropTypes.object,
};

export default AdjustStockModal;
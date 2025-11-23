import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// --- Estado Inicial (Sin cambios) ---
const initialNewProviderState = {
    nombre_proveedor: '',
    razon_social_proveedor: '',
    cuit_proveedor: '',
    telefono_proveedor: '',
    correo_proveedor: '',
    estado_proveedor_id: 7, 
    // Default state
};

// --- Componente de Input Reutilizable (Sin cambios) ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false }) => (
    <div className="relative z-0 w-full">
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`
                block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border 
                rounded-lg appearance-none focus:outline-none focus:ring-0
                ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-pr-yellow'}
                peer
            `}
            placeholder=" " 
        />
        <label
            htmlFor={name}
            className={`
                absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0]
                left-2.5 
                ${error ? 'text-red-400' : 'text-gray-400'}
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                peer-focus:scale-75 peer-focus:-translate-y-4
                ${error ? 'peer-focus:text-red-400' : 'peer-focus:text-pr-yellow'}
            `}
        >
            {label}{required && ' *'}
        </label>
        {error && <p className="mt-1 text-xs text-red-400">{error[0]}</p>}
    </div>
);


// --- Componente Principal del Modal ---
const NewProviderModal = ({ isOpen, onClose, onSuccess }) => {
    const [newProvider, setNewProvider] = useState(initialNewProviderState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); 

    // Resetea el formulario cuando el modal se cierra (Sin cambios)
    useEffect(() => {
        if (!isOpen) {
            setNewProvider(initialNewProviderState);
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // handleChange (Sin cambios)
    const handleChange = (e) => {
        setNewProvider(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
    };

    // --- CAMBIOS EN handleCreateProvider ---
    const handleCreateProvider = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({}); 

        try {
            // --- CAMBIO 1: Sintaxis de Axios POST ---
            // Nota: antes se usaba `apiClient('/api/compras/proveedores/')`. Ahora usar `apiClient.post('/compras/proveedores/', payload)`
            // Ahora: apiClient.post(ruta_sin_api, newProvider)
            await apiClient.post('/compras/proveedores/', newProvider);
            
            toast.success('¡Proveedor creado con éxito!');
            onSuccess(); // Refresca la lista
            onClose(); // Cierra el modal
        
        } catch (error) {
            // --- CAMBIO 2: Manejo de errores de Axios ---
            // Los errores ahora están en error.response.data
            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                toast.error('Por favor, corrige los errores en el formulario.');
            } else {
                // Errores genéricos (ej. 500)
                const errorMsg = errorData?.detail || 'No se pudo crear el proveedor.';
                toast.error(errorMsg);
            }
        
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renderizado del JSX (Sin cambios) ---
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
                    relative p-4 w-full max-w-2xl transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()} 
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Crear Nuevo Proveedor</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    
                    <form className="p-4 md:p-5" onSubmit={handleCreateProvider}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormInput
                                name="nombre_proveedor"
                                label="Nombre del Proveedor"
                                value={newProvider.nombre_proveedor}
                                onChange={handleChange}
                                error={errors.nombre_proveedor}
                                required
                            />
                            <FormInput
                                name="razon_social_proveedor"
                                label="Razón Social"
                                value={newProvider.razon_social_proveedor}
                                onChange={handleChange}
                                error={errors.razon_social_proveedor}
                            />
                            <FormInput
                                name="cuit_proveedor"
                                label="CUIT"
                                value={newProvider.cuit_proveedor}
                                onChange={handleChange}
                                error={errors.cuit_proveedor}
                                required
                            />
                            <FormInput
                                name="telefono_proveedor"
                                label="Teléfono"
                                value={newProvider.telefono_proveedor}
                                onChange={handleChange}
                                error={errors.telefono_proveedor}
                            />
                            <div className="md:col-span-2"> 
                                <FormInput
                                    type="email"
                                    name="correo_proveedor"
                                    label="Correo Electrónico"
                                    value={newProvider.correo_proveedor}
                                    onChange={handleChange}
                                    error={errors.correo_proveedor}
                                />
                            </div>
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
                                className="w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700 disabled:opacity-70 flex items-center justify-center min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Proveedor'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewProviderModal;
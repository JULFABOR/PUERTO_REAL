import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // <-- Añadido para validación de props
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faFloppyDisk, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Componente de Input Reutilizable (Sin cambios) ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false }) => (
    <div className="relative z-0 w-full">
        <input
            type={type}
            name={name}
            id={`edit_${name}`}
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
            htmlFor={`edit_${name}`}
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
        {error && <p className="mt-1 text-xs text-red-400">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
);

// --- Componente Principal del Modal de Edición ---
const EditProviderModal = ({ isOpen, onClose, provider, onSuccess, supplierStates }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Carga datos del proveedor al abrir/cambiar (Sin cambios)
    useEffect(() => {
        if (provider && isOpen) {
            setFormData({
                nombre_proveedor: provider.nombre_proveedor || '',
                razon_social_proveedor: provider.razon_social_proveedor || '',
                cuit_proveedor: provider.cuit_proveedor || '',
                telefono_proveedor: provider.telefono_proveedor || '',
                correo_proveedor: provider.correo_proveedor || '',
                estado_proveedor_id: provider.estado_proveedor?.id_estado || '',
            });
            setErrors({}); 
        }
    }, [provider, isOpen]);

    // Maneja cambios en los inputs y select (Sin cambios)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- CAMBIOS EN handleUpdateProvider ---
    const handleUpdateProvider = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Payload (Sin cambios)
        const payload = {
            nombre_proveedor: formData.nombre_proveedor,
            razon_social_proveedor: formData.razon_social_proveedor,
            cuit_proveedor: formData.cuit_proveedor,
            telefono_proveedor: formData.telefono_proveedor,
            correo_proveedor: formData.correo_proveedor,
            estado_proveedor_id: formData.estado_proveedor_id 
        };

        // Validación (Sin cambios)
         if (!payload.estado_proveedor_id) {
             setErrors({ estado_proveedor_id: ['Debes seleccionar un estado.'] });
             toast.error('Debes seleccionar un estado.');
             setIsSubmitting(false);
             return;
         }

        try {
            // --- CAMBIO 1: Sintaxis de Axios PATCH ---
            // Nota: antes se usaba `apiClient(url, { method: 'PATCH' })`. Ahora usar `apiClient.patch('/compras/compras/:id/', payload)`
            // Ahora: apiClient.patch(ruta_sin_api, payload)
            await apiClient.patch(
                `/compras/proveedores/${provider.id_proveedor}/`, 
                payload
            );
            
            toast.success('¡Proveedor actualizado con éxito!');
            onSuccess(); 
            onClose(); 
        
        } catch (error) {
            // --- CAMBIO 2: Manejo de errores de Axios ---
            // Los errores ahora están en error.response.data
            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                const firstErrorKey = Object.keys(errorData)[0];
                const firstErrorMessage = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];
                toast.error(firstErrorMessage || 'Error de validación. Revisa el formulario.');
            
            } else {
                const errorMsg = errorData?.detail || 'No se pudo actualizar el proveedor.';
                toast.error(errorMsg);
            }
        
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renderizado del JSX (Sin cambios) ---
    return (
        <div /* Overlay */
            className={`
                fixed inset-0 z-50 flex justify-center items-center w-full h-full
                bg-black bg-opacity-70 transition-opacity duration-300
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            onClick={onClose} 
        >
            <div /* Contenedor Modal */
                className={`
                    relative p-0 w-full max-w-2xl transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()} 
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-pr-gray/20">
                    {/* Encabezado */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Editar Proveedor</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Formulario */}
                    <form className="p-4 md:p-5" onSubmit={handleUpdateProvider}>
                        {/* Grid de Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormInput
                                name="nombre_proveedor"
                                label="Nombre del Proveedor"
                                value={formData.nombre_proveedor || ''}
                                onChange={handleChange}
                                error={errors.nombre_proveedor}
                                required
                            />
                            <FormInput
                                name="razon_social_proveedor"
                                label="Razón Social"
                                value={formData.razon_social_proveedor || ''}
                                onChange={handleChange}
                                error={errors.razon_social_proveedor}
                            />
                            <FormInput
                                name="cuit_proveedor"
                                label="CUIT"
                                value={formData.cuit_proveedor || ''}
                                onChange={handleChange}
                                error={errors.cuit_proveedor}
                                required 
                            />
                            <FormInput
                                name="telefono_proveedor"
                                label="Teléfono"
                                value={formData.telefono_proveedor || ''}
                                onChange={handleChange}
                                error={errors.telefono_proveedor}
                            />
                            <div className="md:col-span-2">
                                <FormInput
                                    type="email"
                                    name="correo_proveedor"
                                    label="Correo Electrónico"
                                    value={formData.correo_proveedor || ''}
                                    onChange={handleChange}
                                    error={errors.correo_proveedor}
                                />
                            </div>

                            {/* Select de Estado */}
                            <div>
                                <label
                                    htmlFor="edit_estado_proveedor_id"
                                    className={`block mb-1 text-sm font-medium ${errors.estado_proveedor_id ? 'text-red-400' : 'text-gray-400'}`}
                                >
                                    Estado *
                                </label>
                                <select
                                    id="edit_estado_proveedor_id"
                                    name="estado_proveedor_id" 
                                    value={formData.estado_proveedor_id || ''} 
                                    onChange={handleChange}
                                    required
                                    className={`w-full p-2.5 text-sm text-white bg-pr-dark-gray border rounded-lg focus:border-pr-yellow focus:ring-0 ${errors.estado_proveedor_id ? 'border-red-500' : 'border-gray-500'}`}
                                >
                                    <option value="" disabled>Selecciona un estado</option>
                                    {(supplierStates || []).map(state => (
                                        <option key={state.id_estado} value={state.id_estado}>
                                            {state.nombre_estado}
                                        </option>
                                    ))}
                                </select>
                                {errors.estado_proveedor_id && <p className="mt-1 text-xs text-red-400">{Array.isArray(errors.estado_proveedor_id) ? errors.estado_proveedor_id[0] : errors.estado_proveedor_id}</p>}
                            </div>
                        </div>

                        {/* Botones de Footer */}
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-600"> 
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
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- PropTypes para validación ---
EditProviderModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    provider: PropTypes.object, 
    supplierStates: PropTypes.array, // Cambiado a 'array' (ya que a veces puede ser undefined)
};

// Añadir defaultProps para supplierStates para mayor seguridad
EditProviderModal.defaultProps = {
    supplierStates: [],
    provider: null,
};

export default EditProviderModal;
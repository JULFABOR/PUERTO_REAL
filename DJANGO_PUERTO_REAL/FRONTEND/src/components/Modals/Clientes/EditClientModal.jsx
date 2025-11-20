import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios

const EditClientModal = ({ isOpen, onClose, onSuccess, client }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (client) {
            // Mapeamos los datos del cliente
            setFormData({
                first_name: client.user_first_name || '',
                last_name: client.user_last_name || '',
                email: client.user_email || '',
                dni_cliente: client.dni_cliente || '',
                telefono_cliente: client.telefono_cliente || '',
            });
            setErrors({}); // Limpiar errores al abrir
        }
    }, [client]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        if (!client) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            // --- CAMBIO 1: Sintaxis de Axios PATCH ---
            // Nota: antes se usaba `apiClient(url, { method: 'PATCH' })`. Ahora usar `apiClient.patch('/fidelizacion/clientes/:id/', payload)`
            // Ahora: apiClient.patch(ruta_sin_api, formData)
            await apiClient.patch(
                `/fidelizacion/clientes/${client.id_cliente}/`, 
                formData // Pasamos el objeto de datos directamente
            );
            
            toast.success('¡Cliente actualizado con éxito!');
            onSuccess(); 
            onClose();   
        
        } catch (error) {
            // --- CAMBIO 2: Manejo de errores de Axios ---
            // Los errores de validación de Django están en error.response.data
            const errorData = error.response?.data || {};
            setErrors(errorData);
            
            const firstError = Object.values(errorData).flat()[0] || 'No se pudo actualizar el cliente.';
            toast.error(firstError);
        
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        // --- (Todo tu JSX es perfecto, no se necesita ningún cambio) ---
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    {/* --- Cabecera --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Editar Cliente</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    
                    {/* --- Formulario --- */}
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleUpdateClient}>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Nombre" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Apellido" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            {errors.email && <p className="text-xs text-red-500 -mt-2">{errors.email}</p>}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input name="dni_cliente" value={formData.dni_cliente} onChange={handleChange} placeholder="DNI" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="telefono_cliente" value={formData.telefono_cliente} onChange={handleChange} placeholder="Teléfono" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                            </div>
                            {errors.dni_cliente && <p className="text-xs text-red-500 -mt-2">{errors.dni_cliente}</p>}
                            
                            <p className="text-xs text-gray-400">La gestión de contraseñas se realiza por separado.</p>

                            <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

EditClientModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    client: PropTypes.object,
};

export default EditClientModal;
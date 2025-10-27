import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

// Estado inicial para el formulario
const initialClientState = {
    first_name: '',
    last_name: '',
    email: '',
    dni_cliente: '',
    telefono_cliente: '',
    password: '',
    password_confirm: '',
};

const NewClientModal = ({ isOpen, onClose, onSuccess }) => {
    const [client, setClient] = useState(initialClientState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClient(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo al escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setErrors({}); // Limpiar errores previos

        // --- Validación simple en Frontend ---
        if (client.password !== client.password_confirm) {
            setErrors({ password_confirm: 'Las contraseñas no coinciden.' });
            return toast.error('Las contraseñas no coinciden.');
        }

        setIsSubmitting(true);

        // Preparamos los datos para enviar. 
        // Tu backend espera 'dni_cliente' y 'telefono_cliente' en el modelo Cliente,
        // y el resto en el modelo User. El serializer de Django debe manejar esto.
        const payload = {
            first_name: client.first_name,
            last_name: client.last_name,
            email: client.email,
            dni_cliente: client.dni_cliente,
            telefono_cliente: client.telefono_cliente,
            password: client.password,
        };

        try {
            await apiClient('/api/fidelizacion/clientes/', { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            toast.success('¡Cliente creado con éxito!');
            setClient(initialClientState); // Resetear formulario
            onSuccess(); // Llama a la función (fetchClients) del padre
            onClose();   // Cierra el modal
        } catch (error) {
            // Captura errores de validación del backend (ej. email duplicado)
            const errorData = error.data || {};
            setErrors(errorData);
            
            // Muestra un error genérico o el primer error de la lista
            const firstError = Object.values(errorData).flat()[0] || 'No se pudo crear el cliente.';
            toast.error(firstError);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    {/* --- Cabecera --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Crear Nuevo Cliente</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    
                    {/* --- Formulario --- */}
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleCreateClient}>
                            {/* --- Datos Personales --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <input name="first_name" value={client.first_name} onChange={handleChange} placeholder="Nombre" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="last_name" value={client.last_name} onChange={handleChange} placeholder="Apellido" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            <input name="email" type="email" value={client.email} onChange={handleChange} placeholder="Email" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            {errors.email && <p className="text-xs text-red-500 -mt-2">{errors.email}</p>}
                            
                            {/* --- Datos del Cliente --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <input name="dni_cliente" value={client.dni_cliente} onChange={handleChange} placeholder="DNI" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="telefono_cliente" value={client.telefono_cliente} onChange={handleChange} placeholder="Teléfono" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                            </div>
                            {errors.dni_cliente && <p className="text-xs text-red-500 -mt-2">{errors.dni_cliente}</p>}
                            
                            {/* --- Contraseña --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <input name="password" type="password" value={client.password} onChange={handleChange} placeholder="Contraseña" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="password_confirm" type="password" value={client.password_confirm} onChange={handleChange} placeholder="Confirmar contraseña" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            {errors.password_confirm && <p className="text-xs text-red-500 -mt-2">{errors.password_confirm}</p>}

                            {/* --- Botón --- */}
                            <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Creando...' : 'Crear Cliente'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

NewClientModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};

export default NewClientModal;
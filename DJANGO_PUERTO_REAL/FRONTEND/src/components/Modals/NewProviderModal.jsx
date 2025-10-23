import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const initialNewProviderState = {
    nombre_proveedor: '',
    razon_social_proveedor: '',
    cuit_proveedor: '',
    telefono_proveedor: '',
    correo_proveedor: '',
    estado_proveedor: 30, // Default state
};

const NewProviderModal = ({ isOpen, onClose, onSuccess }) => {
    const [newProvider, setNewProvider] = useState(initialNewProviderState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setNewProvider(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateProvider = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await apiClient('/api/compras/proveedores/', { 
                method: 'POST', 
                body: JSON.stringify(newProvider) 
            });
            toast.success('¡Proveedor creado con éxito!');
            setNewProvider(initialNewProviderState);
            onSuccess();
            onClose();
        } catch (error) {
            const errorMsg = error.data ? Object.values(error.data).join(', ') : 'No se pudo crear el proveedor.';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-2xl">
                <div className="relative rounded-lg shadow bg-pr-dark">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Crear Nuevo Proveedor</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleCreateProvider}>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="nombre_proveedor" value={newProvider.nombre_proveedor} onChange={handleChange} placeholder="Nombre del Proveedor" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="razon_social_proveedor" value={newProvider.razon_social_proveedor} onChange={handleChange} placeholder="Razón Social" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                                <input name="cuit_proveedor" value={newProvider.cuit_proveedor} onChange={handleChange} placeholder="CUIT" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input name="telefono_proveedor" value={newProvider.telefono_proveedor} onChange={handleChange} placeholder="Teléfono" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                                <input type="email" name="correo_proveedor" value={newProvider.correo_proveedor} onChange={handleChange} placeholder="Correo Electrónico" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700">{isSubmitting ? 'Creando...' : 'Crear Proveedor'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewProviderModal;

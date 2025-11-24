import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const CategoryManagerModal = ({ isOpen, onClose, categories, onDataChange }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para la edición en línea
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') {
            return toast.error('El nombre de la categoría no puede estar vacío.');
        }
        setIsLoading(true);
        try {
            await apiClient.post('/stock/categorias/', { nombre_categoria: newCategoryName });
            toast.success('Categoría creada con éxito.');
            setNewCategoryName(''); // Limpiar el input
            onDataChange(); // Refrescar los datos en JefeStock
        } catch (error) {
            const msg = error?.response?.data?.nombre_categoria || error?.response?.data || 'No se pudo crear la categoría.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const loadingToast = toast.loading('Eliminando categoría...');
        setIsLoading(true);
        try {
            await apiClient.delete(`/stock/categorias/${categoryId}/`);
            toast.success('Categoría eliminada.', { id: loadingToast });
            onDataChange(); // Refrescar los datos
        } catch (error) {
            // Error común: no se puede borrar si tiene productos asociados
            const msg = error?.response?.data?.detail || 'No se pudo eliminar. Asegúrate de que no tenga productos asociados.';
            toast.error(msg, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones para edición en línea
    const handleStartEdit = (category) => {
        setEditingCategoryId(category.id_categoria);
        setEditingCategoryName(category.nombre_categoria);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (editingCategoryName.trim() === '') {
            return toast.error('El nombre no puede estar vacío.');
        }
        setIsLoading(true);
        try {
            await apiClient.put(`/stock/categorias/${editingCategoryId}/`, { nombre_categoria: editingCategoryName });
            toast.success('Categoría actualizada.');
            handleCancelEdit(); // Salir del modo edición
            onDataChange(); // Refrescar los datos
        } catch (error) {
            const msg = error?.response?.data?.nombre_categoria || 'No se pudo actualizar.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-md">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    {/* --- Cabecera del Modal --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Gestionar Categorías</h3>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="end-2.5 text-pr-gray bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white"
                        >
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    
                    {/* --- Cuerpo del Modal --- */}
                    <div className="p-4 md:p-5">
                        
                        {/* --- Formulario para Crear --- */}
                        <form className="flex gap-2 mb-4" onSubmit={handleCreateCategory}>
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nombre de la nueva categoría" 
                                className="flex-grow border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow" 
                                disabled={isLoading}
                            />
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Crear
                            </button>
                        </form>

                        {/* --- Lista de Categorías Existentes --- */}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {categories.map((cat) => (
                                <div key={cat.id_categoria} className="flex items-center justify-between p-3 bg-pr-dark-gray rounded-lg">
                                    {editingCategoryId === cat.id_categoria ? (
                                        // --- Modo Edición ---
                                        <form className="flex-grow flex gap-2" onSubmit={handleUpdateCategory}>
                                            <input
                                                type="text"
                                                value={editingCategoryName}
                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                className="flex-grow border text-sm rounded-lg block w-full p-2 bg-pr-dark border-gray-500 text-white"
                                                autoFocus
                                            />
                                            <button type="submit" disabled={isLoading} className="text-pr-green hover:text-pr-green/80 w-8 h-8"><FontAwesomeIcon icon={faSave} /></button>
                                            <button type="button" onClick={handleCancelEdit} disabled={isLoading} className="text-pr-gray hover:text-pr-gray/80 w-8 h-8"><FontAwesomeIcon icon={faTimes} /></button>
                                        </form>
                                    ) : (
                                        // --- Modo Vista ---
                                        <>
                                            <span className="text-white">{cat.nombre_categoria}</span>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => handleStartEdit(cat)} 
                                                    disabled={isLoading} 
                                                    className="text-pr-yellow hover:text-pr-yellow/80 disabled:text-gray-600"
                                                >
                                                    <FontAwesomeIcon icon={faPen} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCategory(cat.id_categoria)} 
                                                    disabled={isLoading} 
                                                    className="text-pr-red hover:text-pr-red/80 disabled:text-gray-600"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

CategoryManagerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    onDataChange: PropTypes.func.isRequired,
};

export default CategoryManagerModal;
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const CategoryManagerModal = ({ isOpen, onClose, categories, onDataChange }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return toast.error("El nombre no puede estar vacío.");
        setIsSubmitting(true);
        try {
            await apiClient('/api/stock/categorias/', { 
                method: 'POST', 
                // --- CORRECCIÓN AQUÍ ---
                body: JSON.stringify({ nombre_categoria: newCategoryName }) 
            });
            setNewCategoryName('');
            toast.success("Categoría creada.");
            onDataChange();
        } catch (error) {
            toast.error("No se pudo crear la categoría.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartEdit = (category) => {
        setEditingCategoryId(category.id_categoria);
        setEditingCategoryName(category.nombre_categoria);
    };

    const handleUpdateCategory = async (categoryId) => {
        if (!editingCategoryName.trim()) return toast.error("El nombre no puede estar vacío.");
        setIsSubmitting(true);
        try {
            await apiClient(`/api/stock/categorias/${categoryId}/`, { 
                method: 'PATCH', 
                // --- CORRECCIÓN AQUÍ ---
                body: JSON.stringify({ nombre_categoria: editingCategoryName }) 
            });
            setEditingCategoryId(null);
            setEditingCategoryName('');
            toast.success("Categoría actualizada.");
            onDataChange();
        } catch (error) {
            toast.error("No se pudo actualizar.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await apiClient(`/api/stock/categorias/${categoryToDelete.id_categoria}/`, { method: 'DELETE' });
            toast.success(`Categoría "${categoryToDelete.nombre_categoria}" eliminada.`);
            onDataChange();
        } catch (error) {
            toast.error("No se pudo eliminar.");
        } finally {
            setCategoryToDelete(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70">
                <div className="relative p-4 w-full max-w-lg">
                    <div className="relative rounded-lg shadow bg-pr-dark">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                            <h3 className="text-xl font-semibold text-white">Gestionar Categorías</h3>
                            <button type="button" onClick={() => { setEditingCategoryId(null); onClose(); }} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                            </button>
                        </div>
                        
                        <div className="p-4 md:p-5 max-h-96 overflow-y-auto">
                            <ul className="space-y-3">
                                {categories.map(cat => (
                                    <li key={cat.id_categoria} className="flex items-center justify-between p-3 rounded-lg bg-pr-dark-gray">
                                        {editingCategoryId === cat.id_categoria ? (
                                            <input type="text" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-500 rounded-lg text-white" autoFocus />
                                        ) : (
                                            <span className="text-white">{cat.nombre_categoria}</span>
                                        )}
                                        <div className="flex items-center gap-3 ml-4">
                                            {editingCategoryId === cat.id_categoria ? (
                                                <>
                                                    <button onClick={() => handleUpdateCategory(cat.id_categoria)} className="text-green-400 hover:text-green-300"><FontAwesomeIcon icon={faSave} /></button>
                                                    <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 hover:text-gray-300"><FontAwesomeIcon icon={faTimes} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleStartEdit(cat)} className="text-pr-yellow hover:text-yellow-300"><FontAwesomeIcon icon={faPenToSquare} /></button>
                                                    <button onClick={() => setCategoryToDelete(cat)} className="text-red-500 hover:text-red-400"><FontAwesomeIcon icon={faTrash} /></button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="p-4 md:p-5 border-t border-gray-600">
                            <form onSubmit={handleCreateCategory} className="flex items-center gap-3">
                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nueva categoría" className="flex-grow p-2.5 bg-pr-dark-gray border border-gray-500 rounded-lg text-white placeholder-gray-400" />
                                <button type="submit" disabled={isSubmitting} className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-800">{isSubmitting ? '...' : 'Agregar'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {categoryToDelete && (
                <div className="fixed top-0 right-0 left-0 z-[60] flex justify-center items-center w-full h-full bg-black bg-opacity-70">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                            <div className="p-6 text-center">
                                <h3 className="mb-5 text-lg font-normal text-gray-300">¿Eliminar categoría <span className="font-bold text-white">"{categoryToDelete.nombre_categoria}"</span>?</h3>
                                <button onClick={handleConfirmDelete} type="button" className="text-white bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2">Sí, eliminar</button>
                                <button onClick={() => setCategoryToDelete(null)} type="button" className="text-gray-300 bg-pr-dark-gray hover:bg-gray-700 rounded-lg border border-gray-500 text-sm px-5 py-2.5">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryManagerModal;
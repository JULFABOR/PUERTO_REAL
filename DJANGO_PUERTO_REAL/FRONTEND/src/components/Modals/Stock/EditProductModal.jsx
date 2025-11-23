import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const EditProductModal = ({ isOpen, onClose, onSuccess, product, categories }) => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (product) {
            setEditingProduct({
                ...product,
                categoria_producto: product.categoria?.id_categoria || '' 
            });
        }
    }, [product]);

    const handleChange = (e) => {
        setEditingProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSubmitting(true);
        const payload = {
            nombre_producto: editingProduct.nombre_producto,
            barcode: editingProduct.barcode,
            precio_unitario_venta_producto: editingProduct.precio_unitario_venta_producto,
            precio_unitario_compra_producto: editingProduct.precio_unitario_compra_producto,
            categoria_producto: editingProduct.categoria_producto ? parseInt(editingProduct.categoria_producto, 10) : null,
        };
        try {
            await apiClient.patch(`/stock/productos/${editingProduct.id_producto}/`, payload);
            toast.success('¡Producto actualizado!');
            onSuccess();
            onClose();
        } catch (error) {
            const msg = error?.response?.data?.detail || 'No se pudo actualizar el producto.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !editingProduct) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Editar Producto</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                             <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleUpdateProduct}>
                            <input name="nombre_producto" value={editingProduct.nombre_producto} onChange={handleChange} placeholder="Nombre del Producto" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            <input name="barcode" value={editingProduct.barcode} onChange={handleChange} placeholder="SKU / Código de Barras" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            <select name="categoria_producto" value={editingProduct.categoria_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                <option value="">Sin categoría</option>
                                {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" step="0.01" name="precio_unitario_venta_producto" value={editingProduct.precio_unitario_venta_producto} onChange={handleChange} placeholder="Precio Venta" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input type="number" step="0.01" name="precio_unitario_compra_producto" value={editingProduct.precio_unitario_compra_producto} onChange={handleChange} placeholder="Precio Compra" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
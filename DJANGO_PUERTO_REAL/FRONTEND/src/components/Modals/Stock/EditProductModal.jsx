import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const EditProductModal = ({ isOpen, onClose, onSuccess, product, categories }) => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [deleteImage, setDeleteImage] = useState(false);

    useEffect(() => {
        if (product) {
            setEditingProduct({
                ...product,
                categoria_producto: product.categoria?.id_categoria || product.categoria_producto || '' 
            });
            
            // Usar imagen_url si existe, sino construir la URL
            if (product.imagen_url) {
                setImagePreview(product.imagen_url);
            } else if (product.imagen_producto) {
                const imgPath = product.imagen_producto;
                const fullUrl = imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath}`;
                setImagePreview(fullUrl);
            } else {
                setImagePreview(null);
            }
            setImageFile(null);
            setDeleteImage(false);
        }
    }, [product]);

    const handleChange = (e) => {
        setEditingProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('nombre_producto', editingProduct.nombre_producto);
            formData.append('barcode', editingProduct.barcode);
            formData.append('precio_unitario_venta_producto', editingProduct.precio_unitario_venta_producto || '0');
            formData.append('precio_unitario_compra_producto', editingProduct.precio_unitario_compra_producto || '0');
            formData.append('categoria_producto', editingProduct.categoria_producto || '');
            
            // Solo enviamos la imagen si el usuario seleccionó una nueva
            if (imageFile) {
                formData.append('imagen_producto', imageFile);
            }
            
            // Lógica para borrar imagen (Depende de cómo tu backend lo maneje, a veces se necesita null)
            if (deleteImage && !imageFile) {
                // Send an explicit flag to the backend to request deletion of the image.
                formData.append('delete_image', 'true');
            }

            // CORRECCIÓN: Eliminamos headers manuales. Dejamos que el navegador ponga el boundary.
            await apiClient.patch(`/stock/productos/${editingProduct.id_producto}/`, formData);
            
            toast.success('¡Producto actualizado correctamente!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Update error:", error);
            const msg = error?.response?.data?.detail || 'No se pudo actualizar el producto.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, sube solo archivos de imagen.');
            return;
        }
        
        const MAX_SIZE = 5242880; 
        if (file.size > MAX_SIZE) {
            toast.error('La imagen no debe superar 5MB.');
            return;
        }
        
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        setDeleteImage(false); // Si sube nueva, no la estamos borrando
    };

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    if (!isOpen || !editingProduct) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70" onClick={onClose}>
            <div className="relative p-4 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Editar Producto</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                             <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleUpdateProduct}>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                                <input name="nombre_producto" value={editingProduct.nombre_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">SKU / Barcode</label>
                                <input name="barcode" value={editingProduct.barcode} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                                <select name="categoria_producto" value={editingProduct.categoria_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white">
                                    <option value="">Sin categoría</option>
                                    {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Precio Venta</label>
                                    <input type="number" step="0.01" name="precio_unitario_venta_producto" value={editingProduct.precio_unitario_venta_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Precio Compra</label>
                                    <input type="number" step="0.01" name="precio_unitario_compra_producto" value={editingProduct.precio_unitario_compra_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-4 mt-2">
                                <label className="block mb-2 text-sm text-gray-400">Imagen del Producto</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-300 file:bg-gray-700 file:border-0 file:text-white file:mr-4 file:py-1 file:px-2 file:rounded hover:file:bg-gray-600" />
                                
                                {imagePreview && (
                                    <div className="mt-3 bg-gray-800 p-2 rounded flex items-start gap-4">
                                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-600" />
                                        <div className="flex items-center h-full pt-2">
                                            <label className="flex items-center text-sm text-red-400 hover:text-red-300 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={deleteImage} 
                                                    onChange={(e) => setDeleteImage(e.target.checked)} 
                                                    disabled={!!imageFile} // Desactivar "borrar" si acabamos de subir una nueva
                                                    className="mr-2 rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500" 
                                                />
                                                Borrar imagen actual
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700">
                                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
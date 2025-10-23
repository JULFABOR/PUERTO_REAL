import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

const initialNewProductState = {
    nombre_producto: '',
    barcode: '',
    precio_unitario_venta_producto: '',
    precio_unitario_compra_producto: '',
    categoria_producto: '', // Cambiado de categoria_producto_id
    estado_producto: '', // Añadido estado_producto
};

const NewProductModal = ({ isOpen, onClose, onSuccess, categories }) => {
    const [newProduct, setNewProduct] = useState(initialNewProductState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productStates, setProductStates] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const fetchProductStates = async () => {
                try {
                    const states = await apiClient('/api/stock/estados-producto/');
                    setProductStates(states || []);
                    // Opcional: establecer un estado por defecto si es necesario
                    if (states && states.length > 0) {
                        setNewProduct(prev => ({ ...prev, estado_producto: states[0].id_estado }));
                    }
                } catch (error) {
                    toast.error("No se pudieron cargar los estados de los productos.");
                }
            };
            fetchProductStates();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setNewProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.categoria_producto) return toast.error("Debes seleccionar una categoría.");
        if (!newProduct.estado_producto) return toast.error("Debes seleccionar un estado.");
        
        setIsSubmitting(true);

        const productDataToSend = {
            nombre_producto: newProduct.nombre_producto,
            barcode: newProduct.barcode,
            precio_unitario_venta_producto: newProduct.precio_unitario_venta_producto,
            precio_unitario_compra_producto: newProduct.precio_unitario_compra_producto,
            categoria_producto: parseInt(newProduct.categoria_producto_id, 10),
            estado_producto: 2, // Asume que 1 es un estado válido como 'Activo'
            stock_adquirido: 0,
            stock_actual: 0,
            // --- CAMPOS AÑADIDOS ---
            descripcion_producto: '', // Campo opcional
            low_stock_threshold: 10,   // Un valor por defecto razonable
            fecha_vencimiento_producto: null // Campo opcional
        };

        try {
            await apiClient('/api/stock/productos/', { 
                method: 'POST', 
                body: JSON.stringify(productDataToSend) 
            });
            toast.success('¡Producto creado con éxito!');
            setNewProduct(initialNewProductState);
            onSuccess();
            onClose();
        } catch (error) {
            // Si el backend envía detalles del error, los mostramos
            const errorMsg = error.data ? Object.values(error.data).join(', ') : 'No se pudo crear el producto.';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
            <div className="relative p-4 w-full max-w-lg">
                <div className="relative rounded-lg shadow bg-pr-dark">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Crear Nuevo Producto</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div className="p-4 md:p-5">
                        <form className="space-y-4" onSubmit={handleCreateProduct}>
                            <input name="nombre_producto" value={newProduct.nombre_producto} onChange={handleChange} placeholder="Nombre del Producto" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            <input name="barcode" value={newProduct.barcode} onChange={handleChange} placeholder="SKU / Código de Barras" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" />
                            <select name="categoria_producto" value={newProduct.categoria_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required>
                                <option value="">Seleccione una categoría</option>
                                {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                            </select>
                            {/* Campo añadido para el estado del producto */}
                            <select name="estado_producto" value={newProduct.estado_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required>
                                <option value="">Seleccione un estado</option>
                                {productStates.map(state => <option key={state.id_estado} value={state.id_estado}>{state.nombre_estado}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" step="0.01" name="precio_unitario_venta_producto" value={newProduct.precio_unitario_venta_producto} onChange={handleChange} placeholder="Precio Venta" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                                <input type="number" step="0.01" name="precio_unitario_compra_producto" value={newProduct.precio_unitario_compra_producto} onChange={handleChange} placeholder="Precio Compra" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white" required />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-yellow-700">{isSubmitting ? 'Creando...' : 'Crear Producto'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewProductModal;
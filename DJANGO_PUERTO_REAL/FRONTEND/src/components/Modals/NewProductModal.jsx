import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const initialNewProductState = {
    nombre_producto: '',
    barcode: '',
    precio_unitario_venta_producto: '',
    precio_unitario_compra_producto: '',
    categoria_producto: '', // ID de la categoría
    estado_producto: '7', // ID del estado (se cargará automáticamente)
};

// --- Componente de Input Reutilizable ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false }) => (
    <div className="relative z-0 w-full">
        <input
            type={type}
            name={name}
            id={`new_${name}`}
            value={value}
            onChange={onChange}
            required={required}
            autoComplete="off"
            className={`
                block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border 
                rounded-lg appearance-none focus:outline-none focus:ring-0
                border-gray-500 focus:border-pr-yellow peer
            `}
            placeholder=" " 
        />
        <label
            htmlFor={`new_${name}`}
            className={`
                absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0]
                left-2.5 text-gray-400 peer-placeholder-shown:scale-100 
                peer-placeholder-shown:translate-y-0 peer-focus:scale-75 
                peer-focus:-translate-y-4 peer-focus:text-pr-yellow
            `}
        >
            {label}{required && ' *'}
        </label>
    </div>
);


const NewProductModal = ({ isOpen, onClose, onSuccess, categories }) => {
    const [newProduct, setNewProduct] = useState(initialNewProductState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Ya no necesitamos 'productStates'

    useEffect(() => {
        if (isOpen) {
            const fetchActiveStateID = async () => {
                try {
                    const statesData = await apiClient('/api/stock/estados-producto/');
                    const allStates = statesData.results || statesData || [];
                    
                    // --- LÓGICA CORREGIDA ---
                    // Buscamos el ID del estado "Activo"
                    const activeState = allStates.find(state => 
                        state.nombre_estado === 'Activo' || state.nombre_estado === 'ACTIVO'
                    );
                    
                    if (activeState) {
                        // Asignamos el ID de "Activo" al estado del formulario
                        setNewProduct(prev => ({ ...prev, estado_producto: activeState.id_estado }));
                    } else {
                        // Si no encontramos 'Activo', lanzamos un error
                        toast.error("Error crítico: El estado 'Activo' no se encuentra en la base de datos.");
                    }

                } catch (error) {
                    toast.error("No se pudo cargar la configuración de estados.");
                }
            };
            fetchActiveStateID();
        } else {
            // Resetea el formulario cuando se cierra el modal
            setNewProduct(initialNewProductState);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setNewProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.categoria_producto) return toast.error("Debes seleccionar una categoría.");
        
        // --- VALIDACIÓN CORREGIDA ---
        // Ahora solo verificamos que el estado se haya cargado (no esté vacío)
        if (!newProduct.estado_producto) return toast.error("El estado 'Activo' no se pudo cargar. Intenta de nuevo.");
        
        setIsSubmitting(true);

        const productDataToSend = {
            nombre_producto: newProduct.nombre_producto,
            barcode: newProduct.barcode,
            precio_unitario_venta_producto: parseFloat(newProduct.precio_unitario_venta_producto),
            precio_unitario_compra_producto: parseFloat(newProduct.precio_unitario_compra_producto),
            categoria_producto: parseInt(newProduct.categoria_producto, 10),
            estado_producto: parseInt(newProduct.estado_producto, 10), // Ya tiene el ID de 'Activo'
            stock_adquirido: 0,
            stock_actual: 0,
            descripcion_producto: '',
            low_stock_threshold: 10,
            fecha_vencimiento_producto: null
        };

        try {
            await apiClient('/api/stock/productos/', { 
                method: 'POST', 
                body: JSON.stringify(productDataToSend) 
            });
            toast.success('¡Producto creado con éxito!');
            onSuccess();
            onClose();
        } catch (error) {
            const errorMsg = error.data ? Object.values(error.data).flat().join(' ') : 'No se pudo crear el producto.';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

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
                    relative p-4 w-full max-w-lg transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Crear Nuevo Producto</h3>
                        <button type="button" onClick={onClose} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    
                    <form className="p-4 md:p-5" onSubmit={handleCreateProduct}>
                        <div className="space-y-6 mb-6">
                            <FormInput
                                name="nombre_producto"
                                label="Nombre del Producto"
                                value={newProduct.nombre_producto}
                                onChange={handleChange}
                                required
                            />
                            <FormInput
                                name="barcode"
                                label="SKU / Código de Barras"
                                value={newProduct.barcode}
                                onChange={handleChange}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    type="number"
                                    name="precio_unitario_venta_producto"
                                    label="Precio Venta"
                                    value={newProduct.precio_unitario_venta_producto}
                                    onChange={handleChange}
                                    required
                                />
                                <FormInput
                                    type="number"
                                    name="precio_unitario_compra_producto"
                                    label="Precio Compra"
                                    value={newProduct.precio_unitario_compra_producto}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <select name="categoria_producto" value={newProduct.categoria_producto} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow" required>
                                <option value="">Seleccione una categoría</option>
                                {categories.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                            </select>
                            
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
                                    'Crear Producto'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewProductModal;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient'; // Ajusta la ruta si es necesario
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faSearch, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import useDebounce from '../../hooks/useDebounce'; // Asegúrate que la ruta sea correcta

// --- Componente de Input Reutilizable (Adaptado para este modal) ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false, step = undefined, min = undefined }) => (
    <div className="relative z-0 w-full">
        <input
            type={type}
            name={name}
            id={`new_order_${name}`} // ID único
            value={value}
            onChange={onChange}
            required={required}
            step={step} // Para inputs numéricos
            min={min}   // Para inputs numéricos
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
            htmlFor={`new_order_${name}`}
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
        {error && <p className="mt-1 text-xs text-red-400">{error[0] || error}</p>} {/* Muestra error de string o array */}
    </div>
);


// Estado inicial para un item de la orden
const initialOrderItem = { product: null, quantity: 1, cost: '' };

const NewOrdenCompraModal = ({ isOpen, onClose, onSuccess, suppliers }) => {
    // --- ESTADOS ---
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Estados para búsqueda de productos
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(productSearchTerm, 300);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // --- EFECTOS ---
    useEffect(() => {
        if (!isOpen) {
            setSelectedSupplier('');
            setOrderItems([]);
            setProductSearchTerm('');
            setSearchResults([]);
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchProducts = async () => {
            if (debouncedSearchTerm.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            setLoadingSearch(true);
            try {
                const data = await apiClient(`/api/stock/productos/?search=${debouncedSearchTerm}`);
                const addedProductIds = orderItems.map(item => item.product.id_producto);
                setSearchResults((data.results || data || []).filter(p => !addedProductIds.includes(p.id_producto)));
            } catch (error) {
                console.error("Error buscando productos:", error);
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        };
        searchProducts();
    }, [debouncedSearchTerm, orderItems]);

    // --- HANDLERS ---
    const handleAddProduct = (product) => {
        setOrderItems(prevItems => [
            ...prevItems,
            {
                product: product,
                quantity: 1,
                // Si el producto tiene 'precio_unitario_compra_producto', úsalo formateado
                cost: product.precio_unitario_compra_producto ? parseFloat(product.precio_unitario_compra_producto).toFixed(2) : ''
            }
        ]);
        setProductSearchTerm('');
        setSearchResults([]);
    };

    const handleItemChange = (index, field, value) => {
        setOrderItems(prevItems => {
            const newItems = [...prevItems];
            if (field === 'quantity') {
                newItems[index][field] = Math.max(1, parseInt(value, 10) || 1);
            } else if (field === 'cost') {
                 const costValue = parseFloat(value);
                 // Guarda como número flotante o string vacío si no es válido
                 newItems[index][field] = isNaN(costValue) ? '' : Math.max(0, costValue).toFixed(2);
            }
            return newItems;
        });
    };

    const handleRemoveItem = (index) => {
        setOrderItems(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const totalOrderCost = useMemo(() => {
        return orderItems.reduce((total, item) => total + ((item.quantity || 0) * (parseFloat(item.cost) || 0)), 0);
    }, [orderItems]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!selectedSupplier) return toast.error("Debes seleccionar un proveedor.");
        if (orderItems.length === 0) return toast.error("Debes añadir al menos un producto.");
        if (orderItems.some(item => !item.quantity || item.quantity <= 0 || item.cost === '' || parseFloat(item.cost) < 0)) {
             return toast.error("Todos los productos deben tener cantidad positiva y costo asignado.");
        }

        setIsSubmitting(true);
        const payload = {
            proveedor_compra: parseInt(selectedSupplier, 10),
            detalles: orderItems.map(item => ({
                producto_dt_comp: item.product.id_producto,
                cant_det_comp: item.quantity,
                precio_unidad_det_comp: parseFloat(item.cost)
            })),
        };

        try {
            await apiClient('/api/compras/compras/', { method: 'POST', body: JSON.stringify(payload) });
            toast.success('¡Orden de compra creada con éxito!');
            onSuccess();
            onClose();
        } catch (error) {
             if (error.data && typeof error.data === 'object') {
                 setErrors(error.data);
                 const firstErrorKey = Object.keys(error.data)[0];
                 const firstErrorMessage = Array.isArray(error.data[firstErrorKey]) ? error.data[firstErrorKey][0] : error.data[firstErrorKey];
                 toast.error(firstErrorMessage || 'Error de validación. Revisa el formulario.');

                 if (firstErrorKey === 'detalles' && Array.isArray(error.data.detalles) && error.data.detalles.length > 0) {
                      const detailError = error.data.detalles[0];
                      const detailFirstKey = Object.keys(detailError)[0];
                      // Intenta mostrar un mensaje más específico del detalle
                      const itemIndexWithError = orderItems.findIndex(item => item.product.id_producto === detailError.producto_dt_comp); // Necesita id en error
                      const itemNum = itemIndexWithError > -1 ? itemIndexWithError + 1 : '?';
                      toast.error(`Error en item ${itemNum}: ${detailError[detailFirstKey]?.[0] || 'Dato inválido'}`);
                 }

             } else {
                 toast.error(error.data?.detail || 'No se pudo crear la orden de compra.');
             }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERIZADO ---
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
                    relative p-0 w-full max-w-3xl transition-all duration-300
                    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    {/* --- Encabezado --- */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className="text-xl font-semibold text-white">Nueva Orden de Compra</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* --- Formulario --- */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-4 md:p-5 space-y-6 max-h-[70vh] overflow-y-auto">

                            {/* Selección de Proveedor */}
                            <div>
                                {/* Usamos label normal para select */}
                                <label htmlFor="supplier-select" className={`block mb-1 text-sm font-medium ${errors.proveedor_compra ? 'text-red-400' : 'text-white'}`}>Proveedor *</label>
                                <select
                                    id="supplier-select"
                                    value={selectedSupplier}
                                    onChange={(e) => { setSelectedSupplier(e.target.value); setErrors(p => ({ ...p, proveedor_compra: null })); }} // Limpia error al cambiar
                                    required
                                    className={`border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray text-white focus:ring-pr-yellow focus:border-pr-yellow ${errors.proveedor_compra ? 'border-red-500' : 'border-gray-500'}`}
                                >
                                    <option value="" disabled>Selecciona un proveedor</option>
                                    {(suppliers || []).map(sup => (
                                        <option key={sup.id_proveedor} value={sup.id_proveedor}>
                                            {sup.nombre_proveedor} {sup.cuit_proveedor ? `(${sup.cuit_proveedor})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.proveedor_compra && <p className="mt-1 text-xs text-red-400">{errors.proveedor_compra[0]}</p>}
                            </div>

                            {/* Búsqueda y Adición de Productos */}
                            <div className="relative">
                                {/* Usamos label normal para el input de búsqueda */}
                                <label htmlFor="product-search" className="block mb-1 text-sm font-medium text-white">Añadir Productos</label>
                                <div className="relative">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                                    <input
                                        type="text"
                                        id="product-search"
                                        placeholder="Buscar por nombre o SKU..."
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        className="border text-sm rounded-lg block w-full p-2.5 pl-10 bg-pr-dark-gray border-gray-500 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                                        autoComplete="off"
                                    />
                                    {loadingSearch && <FontAwesomeIcon icon={faSpinner} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />}
                                </div>
                                {/* Resultados de Búsqueda (Mejorados) */}
                                {searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-pr-dark-gray border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        <ul>
                                            {searchResults.map(p => (
                                                <li key={p.id_producto}
                                                    className="p-3 text-white hover:bg-gray-700 cursor-pointer text-sm flex justify-between items-center border-b border-gray-700 last:border-b-0"
                                                    onClick={() => handleAddProduct(p)}
                                                >
                                                    <div>
                                                        {p.nombre_producto}
                                                        <span className="block text-xs text-pr-gray/70">SKU: {p.barcode || 'N/A'} - Stock: {p.total_stock || 0}</span>
                                                    </div>
                                                     <FontAwesomeIcon icon={faPlus} className="text-green-500 shrink-0 ml-2"/>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* --- Tabla/Lista de Items Añadidos (Mejorada) --- */}
                            {orderItems.length > 0 && (
                                <div className="border border-gray-700 rounded-lg overflow-hidden mt-2"> {/* Margen superior si hay búsqueda */}
                                    <table className="w-full text-sm text-left text-gray-400">
                                        <thead className="text-xs text-white uppercase bg-pr-dark">
                                            <tr>
                                                <th className="px-4 py-2">Producto</th>
                                                <th className="px-4 py-2 w-24 text-center">Cantidad</th> {/* Centrado */}
                                                <th className="px-4 py-2 w-32 text-right">Costo Unit. ($)</th> {/* Alineado derecha */}
                                                <th className="px-4 py-2 w-16 text-center"></th> {/* Centrado */}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {orderItems.map((item, index) => (
                                                <tr key={item.product.id_producto} className="bg-pr-dark-gray hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-2 font-medium text-white">
                                                        {item.product.nombre_producto}
                                                        <span className="block text-xs text-pr-gray/70">SKU: {item.product.barcode || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-16 p-1 text-center text-sm text-white border border-gray-600 rounded bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow" // Centrado y más pequeño
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right"> {/* Alineado derecha */}
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.cost}
                                                            onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                                                            className="w-24 p-1 text-right text-sm text-white border border-gray-600 rounded bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow" // Alineado derecha
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-400 px-2">
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Error general para detalles */}
                            {errors.detalles && typeof errors.detalles === 'string' && <p className="mt-1 text-xs text-red-400">{errors.detalles}</p>}
                            {errors.detalles && Array.isArray(errors.detalles) && !errors.detalles[0]?.producto_dt_comp && <p className="mt-1 text-xs text-red-400">Error en los items. Revisa cantidad y costo.</p>}


                            {/* Total */}
                            {orderItems.length > 0 && (
                                <div className="text-right text-white text-lg font-bold mt-4 border-t border-gray-700 pt-4">
                                    Total Estimado: ${totalOrderCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}

                        </div> {/* Fin del Contenido Scrollable */}

                        {/* --- Pie de Página (Footer) --- */}
                        <div className="flex items-center justify-end p-4 md:p-5 border-t border-gray-600 rounded-b space-x-4">
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
                                disabled={isSubmitting || orderItems.length === 0 || !selectedSupplier}
                                className="w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]" // Ancho mínimo
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                        Creando Orden...
                                    </>
                                ) : (
                                    'Crear Orden de Compra'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewOrdenCompraModal;
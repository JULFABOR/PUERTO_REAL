
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const AdjustStockModal = ({ isOpen, onClose, product, onSubmit }) => {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [type, setType] = useState('add'); // 'add' or 'subtract'

    useEffect(() => {
        if (!isOpen) {
            setQuantity(1);
            setReason('');
            setType('add');
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleLocalSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting adjustment with:", { quantity, reason, type });
        if (!reason) {
            toast.error("El motivo del ajuste es obligatorio.");
            return;
        }
        onSubmit({ quantity: parseInt(quantity, 10), reason, type });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-pr-dark-gray rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-4">Ajustar Stock</h2>
                <p className="text-gray-300 mb-1">Producto: <span className="font-semibold text-white">{product.nombre_producto}</span></p>
                <p className="text-gray-300 mb-6">Stock Actual: <span className="font-semibold text-white">{product.total_stock || 0}</span></p>

                <form onSubmit={handleLocalSubmit}>
                    <div className="mb-4">
                        <label htmlFor="adjustmentType" className="block text-sm font-medium text-gray-300 mb-2">Tipo de Ajuste</label>
                        <select
                            id="adjustmentType"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow"
                        >
                            <option value="add">Añadir</option>
                            <option value="subtract">Quitar</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">Cantidad</label>
                        <div className="flex items-center">
                            <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-700 text-white px-3 py-1 rounded-l-md hover:bg-gray-600">-</button>
                            <input
                                id="quantity"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full p-3 text-center text-white border-t border-b border-gray-600 bg-pr-dark focus:outline-none"
                                required
                            />
                            <button type="button" onClick={() => setQuantity(q => q + 1)} className="bg-gray-700 text-white px-3 py-1 rounded-r-md hover:bg-gray-600">+</button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">Motivo del Ajuste</label>
                        <input
                            id="reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow"
                            placeholder="Ej: Conteo de inventario, producto dañado..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="text-gray-300 hover:text-white font-medium rounded-lg text-sm px-5 py-2.5">
                            Cancelar
                        </button>
                        <button type="submit" className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5">
                            Confirmar Ajuste
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustStockModal;

import React from 'react';

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, title = 'Confirmar acción', description = '', confirmText = 'Confirmar', cancelText = 'Cancelar', loading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70">
            <div className="relative p-4 w-full max-w-md">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="p-6 text-center">
                        <svg className="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
                        {description && <p className="mb-6 text-sm text-pr-gray">{description}</p>}

                        <div className="flex justify-center gap-3">
                            <button onClick={onConfirm} type="button" disabled={loading} className={`text-white bg-pr-yellow hover:bg-yellow-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {loading ? 'Procesando...' : confirmText}
                            </button>
                            <button onClick={onClose} type="button" className="text-gray-300 bg-pr-dark-gray hover:bg-gray-700 rounded-lg border border-gray-500 text-sm px-5 py-2.5">{cancelText}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;

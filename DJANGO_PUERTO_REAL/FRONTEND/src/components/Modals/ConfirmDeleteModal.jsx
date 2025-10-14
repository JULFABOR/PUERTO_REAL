import React from 'react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-70">
            <div className="relative p-4 w-full max-w-md">
                <div className="relative rounded-lg shadow bg-pr-dark border border-gray-700">
                    <div className="p-6 text-center">
                        <svg className="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <h3 className="mb-5 text-lg font-normal text-gray-300">
                            ¿Estás seguro de que quieres eliminar <span className="font-bold text-white">"{itemName}"</span>?
                        </h3>
                        <button onClick={onConfirm} type="button" className="text-white bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2">Sí, estoy seguro</button>
                        <button onClick={onClose} type="button" className="text-gray-300 bg-pr-dark-gray hover:bg-gray-700 rounded-lg border border-gray-500 text-sm px-5 py-2.5">No, cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
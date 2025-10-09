import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const JefeSuppliers = () => {
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [newSupplier, setNewSupplier] = useState({
        nombre_proveedor: '',
        razon_social_proveedor: '',
        telefono_proveedor: '',
        cuit_proveedor: '',
        correo_proveedor: '',
        estado_proveedor: 1, // TODO: Confirmar el ID de estado por defecto
    });
    const [editingSupplier, setEditingSupplier] = useState(null);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/compras/proveedores/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewSupplier(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setEditingSupplier(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/compras/proveedores/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Add authentication headers if required
                },
                body: JSON.stringify(newSupplier)
            });

            if (!response.ok) {
                throw new Error('Error creating supplier');
            }

            setShowNewSupplierModal(false);
            fetchSuppliers(); // Refresh supplier list
            setNewSupplier({ // Reset form
                nombre_proveedor: '',
                razon_social_proveedor: '',
                telefono_proveedor: '',
                cuit_proveedor: '',
                correo_proveedor: '',
                estado_proveedor: 1, // TODO: Confirmar el ID de estado por defecto
            });

        } catch (error) {
            console.error('Failed to create supplier:', error);
        }
    };

    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier);
        setShowEditSupplierModal(true);
    };

    const handleUpdateSupplier = async (e) => {
        e.preventDefault();
        if (!editingSupplier) return;

        try {
            const response = await fetch(`/api/compras/proveedores/${editingSupplier.id_proveedor}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Add authentication headers if required
                },
                body: JSON.stringify(editingSupplier)
            });

            if (!response.ok) {
                throw new Error('Error updating supplier');
            }

            setShowEditSupplierModal(false);
            setEditingSupplier(null);
            fetchSuppliers(); // Refresh supplier list
        } catch (error) {
            console.error('Failed to update supplier:', error);
        }
    };

    const handleDeleteSupplier = async (supplierId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
            try {
                const response = await fetch(`/api/compras/proveedores/${supplierId}/`, {
                    method: 'DELETE',
                    headers: {
                        // TODO: Add authentication headers if required
                    },
                });

                if (!response.ok) {
                    throw new Error('Error deleting supplier');
                }

                fetchSuppliers(); // Refresh supplier list
            } catch (error) {
                console.error('Failed to delete supplier:', error);
            }
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Gestión de Proveedores</h1>
                <button onClick={() => setShowNewSupplierModal(true)} className="w-full sm:w-auto text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Nuevo Proveedor</span>
                </button>
            </div>

            <div className="mb-4">
                <input type="text" id="table-search" className="w-full p-3 text-sm text-white border border-gray-600 rounded-lg bg-pr-dark-gray focus:ring-pr-yellow focus:border-pr-yellow" placeholder="Buscar por nombre, contacto o CUIT..." />
            </div>

            <div className="relative overflow-x-auto shadow-md rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-white uppercase bg-pr-dark">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre Proveedor</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Razón Social</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Email</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Teléfono</th>
                            <th scope="col" className="px-6 py-3 hidden xl:table-cell">CUIT</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id_proveedor} className="border-b bg-pr-dark border-gray-700 hover:bg-pr-dark-gray">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{supplier.nombre_proveedor}</th>
                                <td className="px-6 py-4 hidden sm:table-cell">{supplier.razon_social_proveedor}</td>
                                <td className="px-6 py-4 hidden md:table-cell">{supplier.correo_proveedor}</td>
                                <td className="px-6 py-4 hidden lg:table-cell">{supplier.telefono_proveedor}</td>
                                <td className="px-6 py-4 hidden xl:table-cell">{supplier.cuit_proveedor}</td>
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <button onClick={() => handleEditClick(supplier)} className="font-medium text-blue-500 hover:underline">Editar</button>
                                    <button onClick={() => handleDeleteSupplier(supplier.id_proveedor)} className="font-medium text-red-500 hover:underline">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showNewSupplierModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Registrar Nuevo Proveedor</h3>
                                <button type="button" onClick={() => setShowNewSupplierModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleCreateSupplier}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div> 
                                            <label htmlFor="nombre_proveedor" className="block mb-2 text-sm font-medium text-white">Nombre de la Empresa</label>
                                            <input type="text" name="nombre_proveedor" id="nombre_proveedor" value={newSupplier.nombre_proveedor} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="razon_social_proveedor" className="block mb-2 text-sm font-medium text-white">Razón Social</label>
                                            <input type="text" name="razon_social_proveedor" id="razon_social_proveedor" value={newSupplier.razon_social_proveedor} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="telefono_proveedor" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="telefono_proveedor" id="telefono_proveedor" value={newSupplier.telefono_proveedor} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" required />
                                        </div>
                                        <div>
                                            <label htmlFor="correo_proveedor" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="correo_proveedor" id="correo_proveedor" value={newSupplier.correo_proveedor} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="cuit_proveedor" className="block mb-2 text-sm font-medium text-white">CUIT</label>
                                        <input type="text" name="cuit_proveedor" id="cuit_proveedor" value={newSupplier.cuit_proveedor} onChange={handleChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500 placeholder-gray-400 text-white" />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Proveedor</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditSupplierModal && editingSupplier && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-lg">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Editar Proveedor</h3>
                                <button type="button" onClick={() => setShowEditSupplierModal(false)} className="end-2.5 text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5">
                                <form className="space-y-4" onSubmit={handleUpdateSupplier}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div> 
                                            <label htmlFor="nombre_proveedor_edit" className="block mb-2 text-sm font-medium text-white">Nombre de la Empresa</label>
                                            <input type="text" name="nombre_proveedor" id="nombre_proveedor_edit" value={editingSupplier.nombre_proveedor} onChange={handleUpdateChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="razon_social_proveedor_edit" className="block mb-2 text-sm font-medium text-white">Razón Social</label>
                                            <input type="text" name="razon_social_proveedor" id="razon_social_proveedor_edit" value={editingSupplier.razon_social_proveedor} onChange={handleUpdateChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="telefono_proveedor_edit" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                            <input type="tel" name="telefono_proveedor" id="telefono_proveedor_edit" value={editingSupplier.telefono_proveedor} onChange={handleUpdateChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="correo_proveedor_edit" className="block mb-2 text-sm font-medium text-white">Email</label>
                                            <input type="email" name="correo_proveedor" id="correo_proveedor_edit" value={editingSupplier.correo_proveedor} onChange={handleUpdateChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="cuit_proveedor_edit" className="block mb-2 text-sm font-medium text-white">CUIT</label>
                                        <input type="text" name="cuit_proveedor" id="cuit_proveedor_edit" value={editingSupplier.cuit_proveedor} onChange={handleUpdateChange} className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-500" />
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JefeSuppliers;
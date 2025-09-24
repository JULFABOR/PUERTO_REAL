import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCashRegister, 
    faBoxOpen, 
    faPlusCircle, 
    faAddressBook, 
    faMoneyBillWave 
} from '@fortawesome/free-solid-svg-icons';

const EmpleadoHome = () => {
    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Panel de Control (Empleado)</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                <Link to="/empleado/pos" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faCashRegister} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Nueva Venta (POS)</h3>
                    <p className="text-pr-gray text-sm">Inicia el punto de venta para registrar transacciones.</p>
                </Link>

                <Link to="/empleado/control-stock" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Control Stock</h3>
                    <p className="text-pr-gray text-sm">Consulta el stock actual de todos tus productos.</p>
                </Link>

                <Link to="/empleado/stock" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faPlusCircle} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Stock</h3>
                    <p className="text-pr-gray text-sm">Gestiona y da de alta nuevos productos en tu catálogo.</p>
                </Link>

                <Link to="/empleado/clientes" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Gestión de Clientes</h3>
                    <p className="text-pr-gray text-sm">Consulta y administra tu base de datos de clientes.</p>
                </Link>

                <Link to="/empleado/caja" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Control de Caja</h3>
                    <p className="text-pr-gray text-sm">Realiza arqueos, aperturas y cierres de caja diarios.</p>
                </Link>

            </div>
        </>
    );
};

export default EmpleadoHome;
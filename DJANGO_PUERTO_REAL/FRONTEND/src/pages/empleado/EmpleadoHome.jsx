import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCashRegister, 
    faBoxOpen, 
    faPlusCircle, 
    faAddressBook, 
    faMoneyBillWave,
    faTruck
} from '@fortawesome/free-solid-svg-icons';

const EmpleadoHome = () => {
    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Panel de Control </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">

                <Link to="/empleado/pos" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faCashRegister} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Nueva Venta (POS)</h3>
                    <p className="text-gray-400 text-sm">Inicia el punto de venta para registrar transacciones.</p>
                </Link>

                <Link to="/empleado/control-stock" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Control Stock</h3>
                    <p className="text-gray-400 text-sm">Consulta el stock actual de todos tus productos.</p>
                </Link>

                <Link to="/empleado/stock" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faPlusCircle} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Stock</h3>
                    <p className="text-gray-400 text-sm">Gestiona y da de alta nuevos productos en tu catálogo.</p>
                </Link>

                <Link to="/empleado/clientes" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Gestión de Clientes</h3>
                    <p className="text-gray-400 text-sm">Consulta y administra tu base de datos de clientes.</p>
                </Link>

                <Link to="/empleado/proveedores" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faTruck} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Gestión de Proveedores</h3>
                    <p className="text-gray-400 text-sm">Administra la información y el catálogo de tus proveedores.</p>
                </Link>


                <Link to="/empleado/caja" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Control de Caja</h3>
                    <p className="text-gray-400 text-sm">Realiza arqueos, aperturas y cierres de caja diarios.</p>
                </Link>

            </div>
        </>
    );
};

export default EmpleadoHome;
import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { 
    faBoxOpen, 
    faPlusCircle, 
    faAddressBook, 
    faMoneyBillWave, 
    faChartBar,
    faCog,
    faTruck
} from '@fortawesome/free-solid-svg-icons';

const JefeHome = () => {
    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Panel de Control (Jefe)</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                <Link to="/jefe/control-stock" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Control Stock</h3>
                    <p className="text-pr-gray text-sm">Consulta el stock actual de todos tus productos.</p>
                </Link>

                <Link to="/jefe/stock" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faPlusCircle} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Stock</h3>
                    <p className="text-pr-gray text-sm">Gestiona y da de alta nuevos productos en tu catálogo.</p>
                </Link>

                <Link to="/jefe/customers" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Gestión de Clientes</h3>
                    <p className="text-pr-gray text-sm">Consulta y administra tu base de datos de clientes.</p>
                </Link>

                <Link to="/jefe/suppliers" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faTruck} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Gestión de Proveedores</h3>
                    <p className="text-pr-gray text-sm">Administra la información y el catálogo de tus proveedores.</p>
                </Link>

                <Link to="/jefe/caja" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Control de Caja</h3>
                    <p className="text-pr-gray text-sm">Realiza arqueos, aperturas y cierres de caja diarios.</p>
                </Link>

                <Link to="/jefe/settings" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faCog} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Configuración</h3>
                    <p className="text-pr-gray text-sm">Gestiona ajustes del sistema y usuarios.</p>
                </Link>

                <Link to="/jefe/analysis" className="card-base hover:shadow-pr-yellow/20">
                    <FontAwesomeIcon icon={faChartBar} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="card-title">Reportes de Venta</h3>
                    <p className="text-pr-gray text-sm">Genera un resumen de las ventas y movimientos.</p>
                </Link>

            </div>
        </>
    );
};

export default JefeHome;
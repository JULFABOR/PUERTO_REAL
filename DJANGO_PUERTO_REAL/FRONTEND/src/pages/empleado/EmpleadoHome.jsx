import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCashRegister, 
    faBoxOpen, 
    faPlusCircle, 
    faAddressBook, 
    faMoneyBillWave,
    faTruck
} from '@fortawesome/free-solid-svg-icons';
import { EmpleadoHeader, SectionCard } from '@/components/Empleado';

const EmpleadoHome = () => {
    return (
        <>
            <EmpleadoHeader title="Panel de Control" subtitle="Accesos rápidos a las secciones principales" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">

                <SectionCard
                    to="/empleado/pos"
                    icon={<FontAwesomeIcon icon={faCashRegister} className="text-pr-yellow text-4xl mb-4" />}
                    title="Nueva Venta (POS)"
                    description="Inicia el punto de venta para registrar transacciones."
                />

                <SectionCard
                    to="/empleado/control-stock"
                    icon={<FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-4xl mb-4" />}
                    title="Control Stock"
                    description="Consulta el stock actual de todos tus productos."
                />

                <SectionCard
                    to="/empleado/stock"
                    icon={<FontAwesomeIcon icon={faPlusCircle} className="text-pr-yellow text-4xl mb-4" />}
                    title="Stock"
                    description="Gestiona y da de alta nuevos productos en tu catálogo."
                />

                <SectionCard
                    to="/empleado/clientes"
                    icon={<FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />}
                    title="Gestión de Clientes"
                    description="Consulta y administra tu base de datos de clientes."
                />

                <SectionCard
                    to="/empleado/proveedores"
                    icon={<FontAwesomeIcon icon={faTruck} className="text-pr-yellow text-4xl mb-4" />}
                    title="Gestión de Proveedores"
                    description="Administra la información y el catálogo de tus proveedores."
                />


                <SectionCard
                    to="/empleado/caja"
                    icon={<FontAwesomeIcon icon={faMoneyBillWave} className="text-pr-yellow text-4xl mb-4" />}
                    title="Control de Caja"
                    description="Realiza arqueos, aperturas y cierres de caja diarios."
                />

            </div>
        </>
    );
};

export default EmpleadoHome;
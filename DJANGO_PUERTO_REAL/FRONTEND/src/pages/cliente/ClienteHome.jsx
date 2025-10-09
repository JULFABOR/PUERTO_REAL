import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBeer, 
    faAddressBook,
    faPercent,
    faWineBottle,
    faGift
} from '@fortawesome/free-solid-svg-icons';

const ClienteHome = () => {
    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Panel de Cliente</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                <Link to="/cliente/stock" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faBeer} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Productos</h3>
                    <p className="text-pr-gray text-sm">Consulta los productos de la Tienda.</p>
                </Link>

                <Link to="/cliente/perfil" className="block bg-pr-dark p-6 rounded-lg shadow-lg hover:shadow-pr-yellow/20 hover:-translate-y-1 transition-all duration-300">
                    <FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />
                    <h3 className="font-bold text-xl text-white mb-2">Perfil</h3>
                    <p className="text-pr-gray text-sm">Consulta y administra tu perfil de Puerto Real.</p>
                </Link>

            </div>

            {/* Sección de Promociones por Puntos */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Promociones por Puntos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Promo Card 1 */}
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faPercent} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">10% de Descuento</h3>
                            <p className="text-pr-gray mb-4">En tu próxima compra de vinos seleccionados.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">500 Puntos</div>
                            <button className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
            
                    {/* Promo Card 2 */}
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faWineBottle} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Botella Gratis</h3>
                            <p className="text-pr-gray mb-4">Lleva una botella de nuestro Malbec Clásico sin cargo.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">1500 Puntos</div>
                            <button className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
            
                    {/* Promo Card 3 */}
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between">
                        <div>
                            <div className="text-pr-yellow text-5xl mb-4"><FontAwesomeIcon icon={faGift} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Cata Exclusiva</h3>
                            <p className="text-pr-gray mb-4">Acceso para dos personas a nuestra próxima cata de vinos premium.</p>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-pr-yellow mb-4">3000 Puntos</div>
                            <button className="w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-gray transition-colors">Ver Condiciones</button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </>
    );
};

export default ClienteHome;
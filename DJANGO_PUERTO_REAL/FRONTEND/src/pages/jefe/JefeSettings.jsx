import React, { useState } from 'react';

const JefeSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Configuración</h1>

            <div className="mb-4 border-b border-gray-700">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li className="me-2">
                        <button onClick={() => setActiveTab('profile')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'profile' ? 'text-pr-yellow border-pr-yellow' : 'hover:text-gray-300 hover:border-gray-600'}`}>
                            Mi Perfil
                        </button>
                    </li>
                    <li className="me-2">
                        <button onClick={() => setActiveTab('store')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'store' ? 'text-pr-yellow border-pr-yellow' : 'hover:text-gray-300 hover:border-gray-600'}`}>
                            Tienda
                        </button>
                    </li>
                    <li className="me-2">
                        <button onClick={() => setActiveTab('points')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'points' ? 'text-pr-yellow border-pr-yellow' : 'hover:text-gray-300 hover:border-gray-600'}`}>
                            Puntos
                        </button>
                    </li>
                </ul>
            </div>
            <div>
                {activeTab === 'profile' && (
                    <div className="p-4 rounded-lg bg-pr-dark">
                        <h2 className="text-xl font-bold text-white mb-4">Información Personal</h2>
                        <form className="space-y-6 max-w-lg">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-white">Nombre Completo</label>
                                <input type="text" id="name" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="Gerente de Tienda" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Email</label>
                                <input type="email" id="email" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="gerente@puertoreal.com" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-2 text-sm font-medium text-white">Nueva Contraseña</label>
                                <input type="password" id="password" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" placeholder="••••••••" />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-white">Confirmar Nueva Contraseña</label>
                                <input type="password" id="confirm-password" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" placeholder="••••••••" />
                            </div>
                            <button type="submit" className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
                        </form>
                    </div>
                )}
                {activeTab === 'store' && (
                    <div className="p-4 rounded-lg bg-pr-dark">
                        <h2 className="text-xl font-bold text-white mb-4">Información de la Tienda</h2>
                        <form className="space-y-6 max-w-lg">
                            <div>
                                <label htmlFor="store-name" className="block mb-2 text-sm font-medium text-white">Nombre de la Tienda</label>
                                <input type="text" id="store-name" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="PUERTO REAL Vinería" required />
                            </div>
                            <div>
                                <label htmlFor="store-address" className="block mb-2 text-sm font-medium text-white">Dirección</label>
                                <input type="text" id="store-address" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="Av. Siempre Viva 742" required />
                            </div>
                            <div>
                                <label htmlFor="store-phone" className="block mb-2 text-sm font-medium text-white">Teléfono</label>
                                <input type="tel" id="store-phone" className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="11-1234-5678" />
                            </div>
                            <button type="submit" className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
                        </form>
                    </div>
                )}
                {activeTab === 'points' && (
                    <div className="p-4 rounded-lg bg-pr-dark">
                        <h2 className="text-xl font-bold text-white mb-4">Configuración del Sistema de Puntos</h2>
                        <form className="space-y-6 max-w-lg">
                            <div>
                                <label htmlFor="points-rule" className="block mb-2 text-sm font-medium text-white">Regla de Acumulación</label>
                                <div className="flex items-center gap-4">
                                    <span>Por cada</span>
                                    <input type="number" id="points-currency" className="border text-sm rounded-lg block w-24 p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="100" />
                                    <span>pesos en compras, el cliente gana</span>
                                    <input type="number" id="points-reward" className="border text-sm rounded-lg block w-24 p-2.5 bg-pr-dark-gray border-gray-600 text-white" value="1" />
                                    <span>punto(s).</span>
                                </div>
                            </div>
                            <button type="submit" className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Guardar Regla</button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
};

export default JefeSettings;

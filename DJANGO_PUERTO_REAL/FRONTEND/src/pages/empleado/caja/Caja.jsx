import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faHistory } from '@fortawesome/free-solid-svg-icons';

const Caja = () => {
    const [cajaEstado, setCajaEstado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [montoInicial, setMontoInicial] = useState('');

    const fetchCajaData = async () => {
        setLoading(true);
        try {
            const [estadoRes, historialRes] = await Promise.all([
                apiClient('/api/caja/estado/'),
                apiClient('/api/caja/historial/')
            ]);
            setCajaEstado(estadoRes);
            setHistorial(historialRes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCajaData();
    }, []);

    const handleAbrirCaja = async () => {
        if (!montoInicial || parseFloat(montoInicial) <= 0) {
            alert('Por favor, ingrese un monto inicial válido.');
            return;
        }
        try {
            setLoading(true);
            await apiClient('/api/caja/abrir/', {
                method: 'POST',
                body: JSON.stringify({ monto_inicial: montoInicial }),
            });
            setMontoInicial('');
            fetchCajaData(); // Refresh data
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarCaja = async () => {
        if (!window.confirm('¿Está seguro de que desea cerrar la caja? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            setLoading(true);
            await apiClient('/api/caja/cerrar/', { method: 'POST' });
            fetchCajaData(); // Refresh data
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center text-pr-gray">Cargando datos de la caja...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Control de Caja</h1>

            {/* Estado de Caja y Acciones */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FontAwesomeIcon icon={faStore} className="mr-3 text-pr-yellow" />
                    Estado Actual
                </h2>
                {cajaEstado?.caja_abierta ? (
                    <div className="space-y-4">
                        <p className="text-green-400 font-bold text-lg">Caja Abierta</p>
                        <p className="text-white text-2xl font-mono">${parseFloat(cajaEstado.saldo_actual).toFixed(2)}</p>
                        <p className="text-pr-gray">Abierta por: {cajaEstado.abierta_por}</p>
                        <p className="text-pr-gray">Fecha de apertura: {new Date(cajaEstado.fecha_apertura).toLocaleString()}</p>
                        <button 
                            onClick={handleCerrarCaja}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Cerrar Caja
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-red-500 font-bold text-lg">Caja Cerrada</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={montoInicial}
                                onChange={(e) => setMontoInicial(e.target.value)}
                                placeholder="Monto inicial"
                                className="bg-pr-dark-gray border border-pr-gray/20 rounded-lg py-2 px-4 text-white focus:ring-pr-yellow focus:border-pr-yellow"
                            />
                            <button 
                                onClick={handleAbrirCaja}
                                className="bg-pr-yellow text-pr-dark font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                            >
                                Abrir Caja
                            </button>
                        </div>
                         {cajaEstado?.ultimo_cierre && (
                            <p className="text-pr-gray pt-4">Último cierre: {new Date(cajaEstado.ultimo_cierre).toLocaleString()}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Historial de Movimientos */}
            <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FontAwesomeIcon icon={faHistory} className="mr-3 text-pr-yellow" />
                    Historial de Caja
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-pr-gray">
                        <thead className="border-b border-pr-gray/20">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length > 0 ? (
                                historial.map((mov) => (
                                <tr key={mov.id} className="border-b border-pr-gray/20 hover:bg-pr-dark-gray">
                                    <td className="p-4 text-white">{new Date(mov.fecha).toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`font-bold ${mov.tipo === 'APERTURA' || mov.tipo === 'INGRESO' ? 'text-green-500' : 'text-red-500'}`}>
                                            {mov.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono">${parseFloat(mov.monto).toFixed(2)}</td>
                                    <td className="p-4">{mov.usuario}</td>
                                    <td className="p-4">{mov.notas}</td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-8">No hay movimientos en el historial.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Caja;

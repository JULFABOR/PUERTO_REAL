// src/components/Caja/CloseBoxSection.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 
{ 
    faCashRegister, faExclamationTriangle, faCheckCircle,
    faTimesCircle, faArrowUp, faArrowDown, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import FormInput from '@/components/shared/FormInput';
import PropTypes from 'prop-types'; // <-- Añadido para los nuevos props

// --- ¡NUEVOS PROPS! ---
const CloseCajaSection = ({ 
    cajaEstado, 
    onSuccess,
    closeCaja,      // <-- Prop del hook
    isSubmitting  // <-- Prop del hook
}) => {
    const [realBalance, setRealBalance] = useState('');
    const [difference, setDifference] = useState(0);
    // const [isClosing, setIsClosing] = useState(false); // <-- ¡ELIMINADO!

    // Este useEffect se queda, es LÓGICA DE UI
    // Calcula la diferencia para mostrarla en pantalla
    useEffect(() => {
        if (cajaEstado?.caja_abierta && realBalance !== '') {
            const parsedRealBalance = parseFloat(realBalance);
            const theoreticalBalance = parseFloat(cajaEstado.monto_teorico_caja || 0);
            if (!isNaN(parsedRealBalance)) {
                setDifference(parsedRealBalance - theoreticalBalance);
            } else {
                setDifference(0);
            }
        } else {
            setDifference(0);
        }
    }, [realBalance, cajaEstado]);

    const handleCloseBox = async () => {
        // --- LÓGICA DE API ELIMINADA ---
        // La validación, el toast.loading, el apiClient.post,
        // el try/catch y el setIsClosing... ¡TODO SE FUE AL HOOK!
        
        // Ahora solo llamamos a la función del hook
        const success = await closeCaja(realBalance);

        if (success) {
            // El hook ya mostró el toast y refrescó los datos (via fetchCashStatus)
            setRealBalance('');
            setDifference(0);
            onSuccess(); // Llama al refreshData del padre
        }
        // Si hay error, el hook 'closeCaja' ya mostró el toast.error
    };

    // Lógica de UI (sin cambios)
    const differenceColorClass = difference === 0
        ? 'text-gray-400'
        : difference > 0
            ? 'text-green-500'
            : 'text-red-500';

    // Lógica de UI (sin cambios)
    const differenceIcon = difference === 0
        ? faCheckCircle
        : difference > 0
            ? faArrowUp
            : faArrowDown;

    return (
        <div className="bg-pr-dark p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faCashRegister} className="mr-3 text-red-500" />
                Cierre y Arqueo de Caja
            </h2>
            <div className="space-y-4">
                <div className="bg-pr-dark-gray p-4 rounded-lg flex justify-between items-center">
                    <p className="text-gray-400">Saldo Teórico Actual:</p>
                    <p className="text-white text-xl font-bold">${parseFloat(cajaEstado?.monto_teorico_caja || 0).toFixed(2)}</p>
                </div>

                <FormInput
                    label="Monto Real de Cierre"
                    name="realBalance" // 'name' es mejor
                    type="number"
                    value={realBalance}
                    onChange={(e) => setRealBalance(e.target.value)}
                    placeholder="Ingrese el monto físico en caja"
                    step="0.01"
                    min="0"
                    disabled={isSubmitting} // <-- Controlado por el hook
                />

                <div className="bg-pr-dark-gray p-4 rounded-lg flex justify-between items-center">
                    <p className="text-gray-400">Diferencia de Caja:</p>
                    <p className={`text-xl font-bold ${differenceColorClass}`}>
                        <FontAwesomeIcon icon={differenceIcon} className="mr-2" />
                        {difference.toFixed(2)}
                    </p>
                </div>

                {difference !== 0 && (
                    <div className="bg-red-900/20 text-red-400 p-3 rounded-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <p className="text-sm">¡Advertencia! Hay una diferencia en el arqueo.</p>
                    </div>
                )}

                <button
                    onClick={handleCloseBox}
                    // Usa 'isSubmitting' del prop
                    disabled={isSubmitting || !cajaEstado?.caja_abierta}
                    className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? ( // Usa 'isSubmitting' del prop
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Cerrando...
                        </>
                    ) : (
                        'Cerrar Caja y Realizar Arqueo'
                    )}
                </button>
            </div>
        </div>
    );
};

// Añadimos los nuevos prop-types
CloseCajaSection.propTypes = {
    cajaEstado: PropTypes.object,
    onSuccess: PropTypes.func.isRequired,
    closeCaja: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

export default CloseCajaSection;
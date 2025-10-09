import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const uidb64 = searchParams.get('uidb64');
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (!uidb64 || !token) {
            setError('El enlace de reseteo es inválido o ha expirado.');
            return;
        }

        try {
            const response = await apiClient('/auth/api/password-reset-confirm/', {
                method: 'POST',
                body: JSON.stringify({
                    uidb64,
                    token,
                    password,
                }),
            });

            setMessage(response.message || 'Tu contraseña ha sido restablecida con éxito.');
            setTimeout(() => {
                navigate('/'); // Redirige a la página de login
            }, 3000);

        } catch (err) {
            const errorData = err.response?.data || { detail: 'Ocurrió un error. El enlace puede ser inválido o haber expirado.' };
            const errorMessage = Object.values(errorData).flat().join(' ');
            setError(errorMessage);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen p-4 bg-pr-dark-gray font-sans">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-pr-dark rounded-xl shadow-2xl p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-center text-pr-yellow mb-6">Restablecer Contraseña</h1>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-300">Nueva Contraseña</label>
                            <input 
                                type="password" 
                                id="new-password" 
                                placeholder="••••••••" 
                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-300">Confirmar Nueva Contraseña</label>
                            <input 
                                type="password" 
                                id="confirm-password" 
                                placeholder="••••••••" 
                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                required 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="text-sm text-green-500 text-center">
                                {message}
                            </div>
                        )}

                        <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300">
                            Cambiar Contraseña
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default ResetPasswordPage;

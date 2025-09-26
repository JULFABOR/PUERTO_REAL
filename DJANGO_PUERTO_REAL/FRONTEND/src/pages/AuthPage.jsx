import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initFlowbite } from 'flowbite';
import apiClient from '@/api/apiClient'; // <-- Usando el alias de ruta '@'

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    useEffect(() => {
        initFlowbite();
    }, []);

    // --- Estados para Formularios ---
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // --- Estados para el modal de reseteo de contraseña ---
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');


    // --- Lógica de Envío ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            // Se usa únicamente el apiClient para hacer la llamada a la API
            const data = await apiClient('/auth/api/login/', {
                method: 'POST',
                body: JSON.stringify({
                    username: loginUsername,
                    password: loginPassword,
                }),
            });
            
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify({ 
                email: data.email, 
                userId: data.user_id, 
                rol: data.rol,
                employee_id: data.employee_id
            }));
            navigate('/home');

        } catch (error) {
            console.error('Error de login:', error);
            setLoginError('Nombre de usuario o contraseña incorrectos.');
        }
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (registerPassword !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        // TODO: Implementar la lógica de registro llamando al apiClient
        console.log('Register Submitted', { email: registerEmail, password: registerPassword, firstName, lastName });
        setActiveTab('login');
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setResetMessage('');

        try {
            const response = await apiClient('/auth/api/password-reset/', {
                method: 'POST',
                body: JSON.stringify({ email: resetEmail }),
            });
            
            setResetMessage(response.message);
            setTimeout(() => {
                setShowForgotPasswordModal(false);
                setResetMessage(''); // Limpia el mensaje para la próxima vez
                setResetEmail('');   // Limpia el email
            }, 5000);

        } catch (error) {
            console.error("Error al solicitar reseteo:", error);
            setResetMessage('Ocurrió un error. Por favor, intenta de nuevo.');
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen p-4 bg-pr-dark-gray font-sans">
            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                <div className="text-center lg:text-left px-4 flex flex-col gap-8 items-center">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-bold text-pr-yellow">PUERTO REAL</h1>
                    </div>
                    {/* Aquí puedes volver a poner tu carrusel de Flowbite si lo tenías */}
                </div>

                <div className="w-full max-w-md mx-auto">
                    <div className="bg-pr-dark rounded-xl shadow-2xl p-6 sm:p-8">
                        <div className="mb-4 border-b border-pr-gray">
                            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                                <li className="w-1/2" role="presentation">
                                    <button 
                                        className={`inline-block w-full p-4 border-b-2 rounded-t-lg ${activeTab === 'login' ? 'text-pr-yellow border-pr-yellow' : 'border-transparent text-gray-400 hover:text-pr-yellow hover:border-pr-yellow'}`}
                                        onClick={() => setActiveTab('login')}
                                    >
                                        Iniciar Sesión
                                    </button>
                                </li>
                                <li className="w-1/2" role="presentation">
                                    <button 
                                        className={`inline-block w-full p-4 border-b-2 rounded-t-lg ${activeTab === 'register' ? 'text-pr-yellow border-pr-yellow' : 'border-transparent text-gray-400 hover:text-pr-yellow hover:border-pr-yellow'}`}
                                        onClick={() => setActiveTab('register')}
                                    >
                                        Registrarse
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div>
                            {activeTab === 'login' && (
                                <form className="space-y-6" onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label htmlFor="login-username" className="block mb-2 text-sm font-medium text-gray-300">Nombre de usuario</label>
                                        <input 
                                            type="text" 
                                            id="login-username" 
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                            placeholder="tu_usuario" 
                                            required 
                                            value={loginUsername}
                                            onChange={(e) => setLoginUsername(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="login-password" className="block mb-2 text-sm font-medium text-gray-300">Contraseña</label>
                                        <input 
                                            type="password" 
                                            id="login-password" 
                                            placeholder="••••••••" 
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                            required 
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                        />
                                    </div>
                                    {loginError && (
                                        <div className="text-sm text-red-500 text-center">
                                            {loginError}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowForgotPasswordModal(true)} 
                                            className="text-sm text-pr-yellow hover:underline focus:outline-none"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300">
                                        Ingresar
                                    </button>
                                </form>
                            )}
                            {activeTab === 'register' && (
                                 <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                    {/* Aquí va tu formulario de registro completo */}
                                    <p className="text-white">Formulario de registro...</p>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">Registrar</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para Restablecer Contraseña */}
            {showForgotPasswordModal && (
                <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60">
                    <div className="relative p-4 w-full max-w-md">
                        <div className="relative rounded-lg shadow bg-pr-dark">
                            <div className="flex items-center justify-between p-4 border-b border-gray-600">
                                <h3 className="text-xl font-semibold text-white">Restablecer Contraseña</h3>
                                <button type="button" onClick={() => setShowForgotPasswordModal(false)} className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                                    <span className="sr-only">Cerrar</span>
                                </button>
                            </div>
                            <div className="p-5">
                                {resetMessage ? (
                                    <p className="text-center text-green-400">{resetMessage}</p>
                                ) : (
                                    <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                                        <div>
                                            <label htmlFor="reset-email" className="block mb-2 text-sm font-medium text-gray-300">Tu correo electrónico</label>
                                            <input 
                                                type="email" 
                                                id="reset-email" 
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                                placeholder="nombre@ejemplo.com" 
                                                required 
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">Te enviaremos un enlace a tu correo para que puedas restablecer tu contraseña.</p>
                                        <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 text-center">
                                            Enviar Enlace de Recuperación
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AuthPage;
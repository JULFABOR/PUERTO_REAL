import React, { useState, useEffect, useRef } from 'react';
import { initFlowbite } from 'flowbite';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/api/apiClient';
import { Link, useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const { login } = useAuth(); // Obtener la función de login del contexto
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        try { initFlowbite(); } catch (e) { /* ignore if not available */ }
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
    const [registerError, setRegisterError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');
    const registerFirstNameRef = useRef(null);
    const registerFormRef = useRef(null);
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

    // --- Estados para el modal de reseteo de contraseña ---
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');


    const navigate = useNavigate();

    // --- Lógica de Envío (Refactored) ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loginUsernameRef = useRef(null);
    const loginFormRef = useRef(null);
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsSubmitting(true);
        try {
            const result = await login(loginUsername, loginPassword);
            if (result && result.success) {
                // Esperar un poco para que el contexto actualice el estado
                // Luego navegar a /home
                setTimeout(() => {
                    navigate('/home');
                }, 100);
            } else {
                setLoginError(result?.error || 'Credenciales inválidas.');
            }
        } catch (err) {
            setLoginError('Ocurrió un error al iniciar sesión.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Autofocus cuando se muestra la pestaña de login
    useEffect(() => {
        if (activeTab === 'login') {
            // pequeña espera para asegurar que el input esté montado
            setTimeout(() => loginUsernameRef.current?.focus?.(), 50);
        }
    }, [activeTab]);

    // Autofocus para registro cuando se muestra la pestaña de registro
    useEffect(() => {
        if (activeTab === 'register') {
            setTimeout(() => registerFirstNameRef.current?.focus?.(), 50);
        }
    }, [activeTab]);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');
        setRegisterSuccess('');

        if (isRegisterSubmitting) return;
        setIsRegisterSubmitting(true);

        if (registerPassword !== confirmPassword) {
            setRegisterError("Las contraseñas no coinciden.");
            setIsRegisterSubmitting(false);
            return;
        }

        try {
            const response = await apiClient.post('/auth/register/', {
                first_name: firstName,
                last_name: lastName,
                email: registerEmail,
                password: registerPassword,
                password2: confirmPassword
            });

            const data = response.data || {};
            if (data.token) {
                setRegisterSuccess('¡Registro exitoso! Serás redirigido al login.');
                setTimeout(() => {
                    setActiveTab('login');
                    // Limpiar campos de registro
                    setFirstName('');
                    setLastName('');
                    setRegisterEmail('');
                    setRegisterPassword('');
                    setConfirmPassword('');
                    setRegisterSuccess('');
                }, 3000);
            } else {
                const errorData = response.data || { detail: 'Ocurrió un error desconocido.' };
                const errorMessage = Array.isArray(errorData) ? errorData.join(' ') : (typeof errorData === 'string' ? errorData : Object.values(errorData).flat().join(' '));
                setRegisterError(errorMessage);
            }
        } catch (error) {
            const errorData = error.response?.data || { detail: 'No se pudo conectar con el servidor.' };
            const errorMessage = Array.isArray(errorData) ? errorData.join(' ') : (typeof errorData === 'string' ? errorData : Object.values(errorData).flat().join(' '));
            setRegisterError(errorMessage);
        } finally {
            setIsRegisterSubmitting(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setResetMessage('');

        try {
            const response = await apiClient.post('/auth/password-reset/', { email: resetEmail });
            const data = response.data || {};
            setResetMessage(data.message || 'Si tu correo está en nuestro sistema recibirás un enlace.');
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
                                <form
                                    className="space-y-6"
                                    onSubmit={handleLoginSubmit}
                                    ref={loginFormRef}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!isSubmitting) {
                                                // requestSubmit dispara el onSubmit del form de forma segura
                                                loginFormRef.current?.requestSubmit?.();
                                            }
                                        }
                                    }}
                                >
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
                                            ref={loginUsernameRef}
                                            autoComplete="username"
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
                                            autoComplete="current-password"
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
                                    <button type="submit" disabled={isSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                                        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                                    </button>
                                </form>
                            )}
                            {activeTab === 'register' && (
                                <form
                                    className="space-y-4"
                                    onSubmit={handleRegisterSubmit}
                                    ref={registerFormRef}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!isRegisterSubmitting) {
                                                registerFormRef.current?.requestSubmit?.();
                                            }
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="register-first-name" className="block mb-2 text-sm font-medium text-gray-300">Nombre</label>
                                            <input
                                                type="text"
                                                id="register-first-name"
                                                ref={registerFirstNameRef}
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                placeholder="Leandro"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="register-last-name" className="block mb-2 text-sm font-medium text-gray-300">Apellido</label>
                                            <input
                                                type="text"
                                                id="register-last-name"
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                placeholder="Cruz"
                                                required
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                autoComplete="family-name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="register-email" className="block mb-2 text-sm font-medium text-gray-300">Correo electrónico</label>
                                        <input
                                            type="email"
                                            id="register-email"
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                            placeholder="nombre@ejemplo.com"
                                            required
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-gray-300">Contraseña</label>
                                        <input
                                            type="password"
                                            id="register-password"
                                            placeholder="••••••••"
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                            required
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-300">Confirmar contraseña</label>
                                        <input
                                            type="password"
                                            id="confirm-password"
                                            placeholder="••••••••"
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                     {registerError && (
                                        <div className="text-sm text-red-500 text-center">
                                            {registerError}
                                        </div>
                                    )}
                                    {registerSuccess && (
                                        <div className="text-sm text-green-500 text-center">
                                            {registerSuccess}
                                        </div>
                                    )}
                                    <button type="submit" disabled={isRegisterSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                                        {isRegisterSubmitting ? 'Creando...' : 'Crear Cuenta'}
                                    </button>
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

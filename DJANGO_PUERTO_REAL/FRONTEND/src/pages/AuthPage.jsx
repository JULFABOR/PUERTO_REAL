import React, { useState, useEffect } from 'react';
import { initFlowbite } from 'flowbite';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- Zod Schema for Registration Validation ---
const registerSchema = z.object({
    firstName: z.string({ required_error: "El nombre es requerido."})
        .min(5, { message: 'El nombre debe tener al menos 5 caracteres.' })
        .max(30, { message: 'El nombre no puede tener más de 30 caracteres.' })
        .regex(/^[a-zA-Z\u00C0-\u017F\s]+$/, { message: "El nombre solo puede contener letras y espacios." }),
    lastName: z.string({ required_error: "El apellido es requerido."})
        .min(5, { message: 'El apellido debe tener al menos 5 caracteres.' })
        .max(30, { message: 'El apellido no puede tener más de 30 caracteres.' })
        .regex(/^[a-zA-Z\u00C0-\u017F\s]+$/, { message: "El apellido solo puede contener letras y espacios." }),
    email: z.string({ required_error: "El email es requerido."}).email({ message: 'El formato del correo no es válido.' }),
    password: z.string({ required_error: "La contraseña es requerida."}).min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"], // path of error
});

// --- Zod Schema for Login Validation ---
const loginSchema = z.object({
    username: z.string().min(1, "El nombre de usuario es requerido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});


const AuthPage = () => {
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        try { initFlowbite(); } catch (e) { /* ignore if not available */ }
    }, []);

    // --- States & Forms ---
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginError, setLoginError] = useState(''); // For server-side errors

    const { 
        register: registerLogin, 
        handleSubmit: handleSubmitLogin,
        formState: { errors: errorsLogin, isSubmitting: isLoginSubmitting },
        setFocus: setLoginFocus,
    } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const { 
        register: registerRegister,
        handleSubmit: handleSubmitRegister,
        formState: { errors: errorsRegister, isSubmitting: isRegisterSubmitting },
        watch: watchRegister,
        reset: resetRegisterForm,
        setFocus: setRegisterFocus,
    } = useForm({
        resolver: zodResolver(registerSchema)
    });

    const registerPassword = watchRegister('password', ''); 

    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');

    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const navigate = useNavigate();

    // --- Submit Handlers ---
    const onLoginSubmit = async (data) => {
        setLoginError('');
        try {
            const result = await login(data.username, data.password);
            if (result && result.success) {
                navigate('/home');
            } else {
                setLoginError(result?.error || 'Credenciales inválidas.');
            }
        } catch (err) {
            setLoginError('Ocurrió un error al iniciar sesión.');
        }
    };

    const onRegisterSubmit = async (data) => {
        setRegisterError('');
        setRegisterSuccess('');

        try {
            const response = await apiClient.post('/auth/register/', {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                password: data.password,
                password2: data.confirmPassword
            });

            const responseData = response.data || {};
            if (responseData.token) {
                setRegisterSuccess('¡Registro exitoso! Serás redirigido al login.');
                setTimeout(() => {
                    setActiveTab('login');
                    resetRegisterForm();
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
        }
    };
    
    // Autofocus logic
    useEffect(() => {
        if (activeTab === 'login') {
            setTimeout(() => setLoginFocus('username'), 50);
        } else {
            setTimeout(() => setRegisterFocus('firstName'), 50);
        }
    }, [activeTab, setLoginFocus, setRegisterFocus]);


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
        <div className="flex flex-col min-h-screen bg-pr-dark-gray font-sans">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    <div className="text-center lg:text-left px-4 flex flex-col gap-6 items-center justify-center">
                        {/* --- Espacio para el Logo --- */}
                        <div className="w-48 h-48 md:w-64 md:h-64 bg-pr-yellow rounded-full flex items-center justify-center shadow-lg">
                            {/* Reemplaza este span con tu componente <img /> o <svg /> del logo */}
                            <span className="text-pr-dark font-bold text-2xl select-none">LOGO</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white">PUERTO REAL</h1>
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
                                        onSubmit={handleSubmitLogin(onLoginSubmit)}
                                    >
                                        <div>
                                            <label htmlFor="login-username" className="block mb-2 text-sm font-medium text-gray-300">Nombre de usuario</label>
                                            <input 
                                                type="text" 
                                                id="login-username" 
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                                placeholder="tu_usuario" 
                                                autoComplete="username"
                                                {...registerLogin('username')}
                                            />
                                            {errorsLogin.username && <p className="mt-1 text-sm text-red-500">{errorsLogin.username.message}</p>}
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="login-password" className="block mb-2 text-sm font-medium text-gray-300">Contraseña</label>
                                            <input 
                                                type={showLoginPassword ? 'text' : 'password'} 
                                                id="login-password" 
                                                placeholder="••••••••" 
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5" 
                                                autoComplete="current-password"
                                                {...registerLogin('password')}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-pr-yellow focus:outline-none"
                                            >
                                                <FontAwesomeIcon icon={showLoginPassword ? faEyeSlash : faEye} />
                                            </button>
                                        </div>
                                        {errorsLogin.password && <p className="mt-1 text-sm text-red-500">{errorsLogin.password.message}</p>}
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
                                        <button type="submit" disabled={isLoginSubmitting} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                                            {isLoginSubmitting ? 'Ingresando...' : 'Ingresar'}
                                        </button>
                                    </form>
                                )}
                                {activeTab === 'register' && (
                                    <form
                                        className="space-y-4"
                                        onSubmit={handleSubmitRegister(onRegisterSubmit)}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="register-first-name" className="block mb-2 text-sm font-medium text-gray-300">Nombre</label>
                                                <input
                                                    type="text"
                                                    id="register-first-name"
                                                    className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                    placeholder="Tu nombre"
                                                    autoComplete="given-name"
                                                    {...registerRegister('firstName')}
                                                />
                                                {errorsRegister.firstName && <p className="mt-1 text-sm text-red-500">{errorsRegister.firstName.message}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="register-last-name" className="block mb-2 text-sm font-medium text-gray-300">Apellido</label>
                                                <input
                                                    type="text"
                                                    id="register-last-name"
                                                    className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                    placeholder="Tu apellido"
                                                    autoComplete="family-name"
                                                    {...registerRegister('lastName')}
                                                />
                                                {errorsRegister.lastName && <p className="mt-1 text-sm text-red-500">{errorsRegister.lastName.message}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="register-email" className="block mb-2 text-sm font-medium text-gray-300">Correo electrónico</label>
                                            <input
                                                type="email"
                                                id="register-email"
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                placeholder="tu.correo@ejemplo.com"
                                                autoComplete="email"
                                                {...registerRegister('email')}
                                            />
                                            {errorsRegister.email ? (
                                                <p className="mt-1 text-sm text-red-500">{errorsRegister.email.message}</p>
                                            ) : (
                                                <p className="mt-2 text-xs text-gray-400">Usaremos este correo para verificar tu cuenta.</p>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-gray-300">Contraseña</label>
                                            <input
                                                type={showRegisterPassword ? 'text' : 'password'}
                                                id="register-password"
                                                placeholder="Crea una contraseña segura"
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                                autoComplete="new-password"
                                                {...registerRegister('password')}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-pr-yellow focus:outline-none"
                                            >
                                                <FontAwesomeIcon icon={showRegisterPassword ? faEyeSlash : faEye} />
                                            </button>
                                        </div>
                                        <PasswordStrengthMeter password={registerPassword} />
                                        <div className="relative">
                                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-300">Confirmar contraseña</label>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirm-password"
                                                placeholder="Confirma tu contraseña"
                                                className={`bg-pr-dark-gray border ${errorsRegister.confirmPassword ? 'border-red-500' : 'border-pr-gray'} text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5`}
                                                autoComplete="new-password"
                                                {...registerRegister('confirmPassword')}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-pr-yellow focus:outline-none"
                                            >
                                                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                            </button>
                                        </div>
                                        {errorsRegister.confirmPassword && (
                                            <p className="text-sm text-red-500">{errorsRegister.confirmPassword.message}</p>
                                        )}
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
            </main>

            {/* Footer */}
            <footer className="w-full bg-pr-dark text-center p-4">
                <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Puerto Real. Todos los derechos reservados.</p>
            </footer>

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
        </div>
    );
};

export default AuthPage;

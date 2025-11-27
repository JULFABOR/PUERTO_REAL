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
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');
    const registerFirstNameRef = useRef(null);
    const registerFormRef = useRef(null);
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
    const [registerFieldErrors, setRegisterFieldErrors] = useState({});
    const [clientFieldErrors, setClientFieldErrors] = useState({});

    // --- Estados para el modal de reseteo de contraseña ---
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    // --- Estados para mostrar/ocultar contraseñas ---
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


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
            const usernameTrim = (loginUsername || '').trim();
            let result = await login(usernameTrim, loginPassword);

            // Si falla el primer intento, reintentar con lowercase (casos donde el usuario se registró con minúsculas)
            if (!result || !result.success) {
                try {
                    const lower = usernameTrim.toLowerCase();
                    if (lower !== usernameTrim) {
                        result = await login(lower, loginPassword);
                    }
                } catch (e) {
                    // ignore
                }
            }
            if (result && result.success) {
                // Esperar un poco para que el contexto actualice el estado
                // Luego navegar a /home
                setTimeout(() => {
                    navigate('/home');
                }, 100);
            } else {
                console.debug('Login fallo, respuesta:', result);
                setLoginError(result?.error || 'Credenciales inválidas.');
            }
        } catch (err) {
            console.error('Error en login (exception):', err?.response?.data || err);
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
        try {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
        } catch (err) {
            console.warn('handleRegisterSubmit: evento inválido o preventDefault falló', err);
        }
        console.debug('handleRegisterSubmit invoked', { firstName, lastName, registerEmail, registerUsername });
        setRegisterError('');
        setRegisterSuccess('');

        if (isRegisterSubmitting) return;
        setIsRegisterSubmitting(true);

        // Evitar envío si hay errores de validación en cliente
        if (Object.keys(clientFieldErrors).length > 0) {
            setRegisterError('Corrige los errores del formulario antes de enviar.');
            setIsRegisterSubmitting(false);
            return;
        }

        if (registerPassword !== confirmPassword) {
            setRegisterError("Las contraseñas no coinciden.");
            setIsRegisterSubmitting(false);
            return;
        }

            // Helper: extrae un mensaje legible desde distintas formas de error que devuelve DRF
            const extractErrorMessage = (payload) => {
                if (!payload) return 'Ocurrió un error desconocido.';
                if (typeof payload === 'string') return payload;
                if (Array.isArray(payload)) return payload.join(' ');
                try {
                    // Flatten deeply nested arrays/objects to readable strings
                    const parts = [];
                    const walk = (v, keyPrefix = null) => {
                        if (v == null) return;
                        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                            parts.push(keyPrefix ? `${keyPrefix}: ${String(v)}` : String(v));
                        } else if (Array.isArray(v)) {
                            v.forEach((item) => walk(item, keyPrefix));
                        } else if (typeof v === 'object') {
                            Object.entries(v).forEach(([k, val]) => walk(val, keyPrefix ? `${keyPrefix}.${k}` : k));
                        }
                    };
                    walk(payload);
                    if (parts.length) return parts.join(' | ');
                } catch (e) {
                    // fallback
                }
                return 'Ocurrió un error en la petición.';
            };

            try {
                const payload = {
                    first_name: firstName,
                    last_name: lastName,
                    email: registerEmail,
                    password: registerPassword,
                    password2: confirmPassword
                };
                const uname = (registerUsername || '').trim();
                if (uname) payload.username = uname;

                const response = await apiClient.post('/auth/register/', payload);

                console.debug('Register response:', response?.data, 'status:', response?.status);
                const data = response.data || {};

                // Consideramos exitosa la creación si el servidor responde 2xx
                if (response.status >= 200 && response.status < 300) {
                    setRegisterSuccess('¡Registro exitoso! Serás redirigido al login.');
                    setTimeout(() => {
                        setActiveTab('login');
                        // Limpiar campos de registro
                        setFirstName('');
                        setLastName('');
                        setRegisterUsername('');
                        setRegisterEmail('');
                        setRegisterPassword('');
                        setConfirmPassword('');
                        setRegisterSuccess('');
                    }, 3000);
                } else {
                    const errorMessage = extractErrorMessage(data);
                    setRegisterError(errorMessage);
                }
            } catch (error) {
                setRegisterFieldErrors({});
                const errorData = error.response?.data || { detail: 'No se pudo conectar con el servidor.' };
                console.debug('Register error response:', error.response);
                // Si el backend devuelve un objeto con errores por campo, guardarlos para mostrarlos al lado de cada input
                if (error.response?.data && typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
                    setRegisterFieldErrors(error.response.data);
                    const topMessage = extractErrorMessage(error.response.data);
                    setRegisterError(topMessage);
                } else {
                    const errorMessage = extractErrorMessage(errorData);
                    setRegisterError(errorMessage);
                }
            } finally {
                setIsRegisterSubmitting(false);
            }
    };

    // -------------------- Validaciones en tiempo real --------------------
    const validateEmail = (email) => {
        if (!email) return 'El correo es requerido.';
        const re = /^\S+@\S+\.\S+$/;
        if (!re.test(email)) return 'Formato de correo inválido.';
        return null;
    };

    const validateUsername = (username) => {
        if (!username) return null; // opcional
        const u = username.trim();
        if (u.length < 3) return 'El usuario debe tener al menos 3 caracteres.';
        if (u.length > 30) return 'El usuario debe tener menos de 30 caracteres.';
        const re = /^[a-zA-Z0-9._-]+$/;
        if (!re.test(u)) return 'Solo letras, números, puntos, guiones y guiones bajos.';
        return null;
    };

    const validatePassword = (pwd) => {
        if (!pwd) return 'La contraseña es requerida.';
        if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/[A-Z]/.test(pwd)) return 'Incluye al menos una letra mayúscula.';
        if (!/[a-z]/.test(pwd)) return 'Incluye al menos una letra minúscula.';
        if (!/[0-9]/.test(pwd)) return 'Incluye al menos un número.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Incluye al menos un carácter especial.';
        return null;
    };

    const validateConfirmPassword = (pwd, confirm) => {
        if (!confirm) return 'Confirma la contraseña.';
        if (pwd !== confirm) return 'Las contraseñas no coinciden.';
        return null;
    };

    const validateName = (name) => {
        if (!name || !name.trim()) return 'Este campo es requerido.';
        if (name.trim().length < 2) return 'Ingrese al menos 2 caracteres.';
        return null;
    };

    // Handlers que validan en tiempo real
    const handleRegisterEmailChange = (e) => {
        const v = e.target.value;
        setRegisterEmail(v);
        const err = validateEmail(v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.email = err; else delete copy.email;
            return copy;
        });
    };

    const handleRegisterUsernameChange = (e) => {
        const v = e.target.value;
        setRegisterUsername(v);
        const err = validateUsername(v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.username = err; else delete copy.username;
            return copy;
        });
    };

    const handleFirstNameChange = (e) => {
        const v = e.target.value;
        setFirstName(v);
        const err = validateName(v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.first_name = err; else delete copy.first_name;
            return copy;
        });
    };

    const handleLastNameChange = (e) => {
        const v = e.target.value;
        setLastName(v);
        const err = validateName(v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.last_name = err; else delete copy.last_name;
            return copy;
        });
    };

    const handleRegisterPasswordChange = (e) => {
        const v = e.target.value;
        setRegisterPassword(v);
        const err = validatePassword(v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.password = err; else delete copy.password;
            if (confirmPassword) {
                const cErr = validateConfirmPassword(v, confirmPassword);
                if (cErr) copy.password2 = cErr; else delete copy.password2;
            }
            return copy;
        });
    };

    const handleConfirmPasswordChange = (e) => {
        const v = e.target.value;
        setConfirmPassword(v);
        const err = validateConfirmPassword(registerPassword, v);
        setClientFieldErrors((s) => {
            const copy = { ...s };
            if (err) copy.password2 = err; else delete copy.password2;
            return copy;
        });
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
                                        <div className="relative">
                                            <input 
                                                type={showLoginPassword ? "text" : "password"} 
                                                id="login-password" 
                                                placeholder="••••••••" 
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5 pr-10" 
                                                required 
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pr-yellow transition"
                                                tabIndex={-1}
                                            >
                                                {showLoginPassword ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4c4.478 0 8.268 2.943 9.542 7-.283.917-.7 1.793-1.217 2.613l-1.485-1.485c.294-.682.45-1.429.45-2.128a4 4 0 00-8-0v.001l-1.464-1.465C5.302 6.167 7.517 4 10 4zm0 12a8.958 8.958 0 01-3.942-.898l1.431-1.431A4 4 0 0014 10h.001l1.464 1.464A8.968 8.968 0 0110 16z" clipRule="evenodd"></path></svg>
                                                )}
                                            </button>
                                        </div>
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
                                    onSubmitCapture={(e) => e.preventDefault()}
                                    ref={registerFormRef}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!isRegisterSubmitting) {
                                                // Llamamos directamente al handler para evitar comportamiento nativo
                                                handleRegisterSubmit(e);
                                            }
                                        }
                                    }}
                                >
                                    <div>
                                        <label htmlFor="register-username" className="block mb-2 text-sm font-medium text-gray-300">Nombre de usuario (opcional)</label>
                                        <input
                                            type="text"
                                            id="register-username"
                                            className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5"
                                            placeholder="tu_usuario (opcional)"
                                            value={registerUsername}
                                            onChange={handleRegisterUsernameChange}
                                            autoComplete="username"
                                        />
                                        {clientFieldErrors.username && (
                                            <div className="text-xs text-red-400 mt-1">{clientFieldErrors.username}</div>
                                        )}
                                        {registerFieldErrors.username && (
                                            <div className="text-xs text-red-400 mt-1">
                                                {Array.isArray(registerFieldErrors.username) ? registerFieldErrors.username.join(' ') : String(registerFieldErrors.username)}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">Si lo dejas vacío usaremos tu correo como nombre de usuario.</div>
                                    </div>
                                    {/* Nota: el backend usa el correo como `username` por defecto si lo dejas vacío. */}
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
                                                onChange={handleFirstNameChange}
                                                autoComplete="given-name"
                                            />
                                            {clientFieldErrors.first_name && (
                                                <div className="text-xs text-red-400 mt-1">{clientFieldErrors.first_name}</div>
                                            )}
                                            {registerFieldErrors.first_name && (
                                                    <div className="text-xs text-red-400 mt-1">
                                                        {Array.isArray(registerFieldErrors.first_name) ? registerFieldErrors.first_name.join(' ') : String(registerFieldErrors.first_name)}
                                                    </div>
                                                )}
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
                                                onChange={handleLastNameChange}
                                                autoComplete="family-name"
                                            />
                                            {clientFieldErrors.last_name && (
                                                <div className="text-xs text-red-400 mt-1">{clientFieldErrors.last_name}</div>
                                            )}
                                                {registerFieldErrors.last_name && (
                                                    <div className="text-xs text-red-400 mt-1">
                                                        {Array.isArray(registerFieldErrors.last_name) ? registerFieldErrors.last_name.join(' ') : String(registerFieldErrors.last_name)}
                                                    </div>
                                                )}
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
                                            onChange={handleRegisterEmailChange}
                                            autoComplete="email"
                                        />
                                        {clientFieldErrors.email && (
                                            <div className="text-xs text-red-400 mt-1">{clientFieldErrors.email}</div>
                                        )}
                                        {registerFieldErrors.email && (
                                            <div className="text-xs text-red-400 mt-1">
                                                {Array.isArray(registerFieldErrors.email) ? registerFieldErrors.email.join(' ') : String(registerFieldErrors.email)}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">Se usará tu correo como nombre de usuario.</div>
                                    </div>
                                    <div>
                                        <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-gray-300">Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showRegisterPassword ? "text" : "password"}
                                                id="register-password"
                                                placeholder="••••••••"
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5 pr-10"
                                                required
                                                value={registerPassword}
                                                onChange={handleRegisterPasswordChange}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pr-yellow transition"
                                                tabIndex={-1}
                                            >
                                                {showRegisterPassword ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4c4.478 0 8.268 2.943 9.542 7-.283.917-.7 1.793-1.217 2.613l-1.485-1.485c.294-.682.45-1.429.45-2.128a4 4 0 00-8-0v.001l-1.464-1.465C5.302 6.167 7.517 4 10 4zm0 12a8.958 8.958 0 01-3.942-.898l1.431-1.431A4 4 0 0014 10h.001l1.464 1.464A8.968 8.968 0 0110 16z" clipRule="evenodd"></path></svg>
                                                )}
                                            </button>
                                        </div>
                                        {clientFieldErrors.password && (
                                            <div className="text-xs text-red-400 mt-1">{clientFieldErrors.password}</div>
                                        )}
                                        {registerFieldErrors.password && (
                                            <div className="text-xs text-red-400 mt-1">
                                                {Array.isArray(registerFieldErrors.password) ? registerFieldErrors.password.join(' ') : String(registerFieldErrors.password)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-300">Confirmar contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirm-password"
                                                placeholder="••••••••"
                                                className="bg-pr-dark-gray border border-pr-gray text-white text-sm rounded-lg focus:ring-pr-yellow focus:border-pr-yellow block w-full p-2.5 pr-10"
                                                required
                                                value={confirmPassword}
                                                onChange={handleConfirmPasswordChange}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pr-yellow transition"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4c4.478 0 8.268 2.943 9.542 7-.283.917-.7 1.793-1.217 2.613l-1.485-1.485c.294-.682.45-1.429.45-2.128a4 4 0 00-8-0v.001l-1.464-1.465C5.302 6.167 7.517 4 10 4zm0 12a8.958 8.958 0 01-3.942-.898l1.431-1.431A4 4 0 0014 10h.001l1.464 1.464A8.968 8.968 0 0110 16z" clipRule="evenodd"></path></svg>
                                                )}
                                            </button>
                                        </div>
                                        {clientFieldErrors.password2 && (
                                            <div className="text-xs text-red-400 mt-1">{clientFieldErrors.password2}</div>
                                        )}
                                        {registerFieldErrors.password2 && (
                                            <div className="text-xs text-red-400 mt-1">
                                                {Array.isArray(registerFieldErrors.password2) ? registerFieldErrors.password2.join(' ') : String(registerFieldErrors.password2)}
                                            </div>
                                        )}
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
                                    <button type="button" onClick={handleRegisterSubmit} disabled={isRegisterSubmitting || Object.keys(clientFieldErrors).length > 0} className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
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

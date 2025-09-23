import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initFlowbite } from 'flowbite';

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    useEffect(() => {
        initFlowbite();
    }, []);

    // --- Estados para Formularios ---
    const [loginUsername, setLoginUsername] = useState(''); // Cambiado de loginEmail a loginUsername
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // --- Lógica de Envío ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const response = await fetch('/auth/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: loginUsername, // Usar el nuevo estado
                    password: loginPassword,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify({ 
                    email: data.email, 
                    userId: data.user_id, 
                    rol: data.rol 
                }));
                navigate('/home');
            } else {
                setLoginError('Nombre de usuario o contraseña incorrectos.');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            setLoginError('No se pudo conectar con el servidor. Inténtalo más tarde.');
        }
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (registerPassword !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        console.log('Register Submitted', { email: registerEmail, password: registerPassword, firstName, lastName });
        setActiveTab('login');
    };

    return (
        <main className="flex items-center justify-center min-h-screen p-4 bg-pr-dark-gray font-sans">
            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                <div className="text-center lg:text-left px-4 flex flex-col gap-8 items-center">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-bold text-pr-yellow">PUERTO REAL</h1>
                    </div>
                    <div id="default-carousel" className="relative w-full max-w-lg mx-auto lg:mx-0 rounded-lg overflow-hidden" data-carousel="slide">
                        {/* ... carrusel ... */}
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
                                <form className="space-y-6" onSubmit={handleLoginSubmit}>
                                    <div>
                                        {/* Campo cambiado a Nombre de usuario */}
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
                                        <a href="#" className="text-sm text-pr-yellow hover:underline">¿Olvidaste tu contraseña?</a>
                                    </div>
                                    <button type="submit" className="w-full text-pr-dark bg-pr-yellow hover:bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition duration-300">
                                        Ingresar
                                    </button>
                                </form>
                            )}
                            {activeTab === 'register' && (
                                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                    {/* ... registration form ... */}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AuthPage;
import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios

function ApiTest() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(localStorage.getItem('authToken') || '');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setError('');

        try {
            // --- CAMBIO 1: Sintaxis Axios POST ---
            // Nota: antes se usaba `apiClient('/auth/api/login/')`. Ahora usar `apiClient.post('/auth/login/', { username, password })`
            // Ahora: apiClient.post(ruta_sin_api, datos)
            const response = await apiClient.post('/auth/login/', { 
                username, 
                password 
            });

            // --- CAMBIO 2: Acceso a datos con .data ---
            const result = response.data; // Los datos están en response.data
            
            localStorage.setItem('authToken', result.token);
            setToken(result.token);
            setUsername('');
            setPassword('');
        
        } catch (err) {
            // --- CAMBIO 3: Manejo de error de Axios ---
            console.error("Error al iniciar sesión:", err);
            // Los errores de login de Django suelen estar en 'non_field_errors'
            const errorMsg = err.response?.data?.non_field_errors?.[0] || err.message || 'Error de inicio de sesión';
            setLoginError(errorMsg);
        }
    };

    // Effect to fetch data after login or on token change
    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                setError('');
                try {
                    // --- CAMBIO 4: Sintaxis Axios GET ---
                    // Antes: const result = await apiClient('/caja/api/estado/');
                    // Ahora:
                    const response = await apiClient.get('/caja/estado/');
                    
                    // --- CAMBIO 5: Acceso a datos con .data ---
                    setData(response.data);
                
                } catch (err) {
                    // --- CAMBIO 6: Manejo de error de Axios ---
                    console.error("Error al obtener datos de la API:", err);
                    const errorMsg = err.response?.data?.detail || err.message;
                    setError(errorMsg);
                    
                    // --- CAMBIO 7: Revisión de status de error ---
                    // Es más fiable revisar el status 401
                    if (err.response?.status === 401) {
                        localStorage.removeItem('authToken');
                        setToken('');
                    }
                }
            };
            fetchData();
        }
    }, [token]);

    const handleLogout = async () => {
        try {
            // --- CAMBIO 8: Sintaxis Axios POST ---
            // Nota: antes se usaba `apiClient('/auth/api/logout/')`. Ahora usar `apiClient.post('/auth/logout/')`
            // Ahora:
            await apiClient.post('/auth/logout/');
        
        } catch (err) {
            console.error("Error al cerrar sesión en el servidor:", err);
        }
        
        // Limpieza local (sin cambios)
        localStorage.removeItem('authToken');
        setToken('');
        setData(null);
        setError('');
        setLoginError('');
    };

    // --- RENDERIZADO (Sin cambios) ---
    return (
        <div style={{ border: '2px dashed #007bff', padding: '1rem', margin: '1rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h2 style={{ color: '#007bff' }}>Prueba de Integración Frontend-Backend</h2>

            {!token ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                    <h3>Iniciar Sesión</h3>
                    {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
                    <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <button type="submit" style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
                        Iniciar Sesión
                    </button>
                </form>
            ) : (
                <div>
                    <p>¡Sesión iniciada! Token: {token.substring(0, 10)}...</p>
                    <button onClick={handleLogout} style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer', marginBottom: '1rem' }}>
                        Cerrar Sesión
                    </button>
                    {error ? (
                        <p style={{ color: 'red' }}>{error}</p>
                    ) : (
                        <div>
                            <p>Datos del Backend (autenticado):</p>
                            <pre>{JSON.stringify(data, null, 2) || 'Cargando...'}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ApiTest;
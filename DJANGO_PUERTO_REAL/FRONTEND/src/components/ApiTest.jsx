import { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';

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
        // La llamada a la API ahora es una sola línea
        const result = await apiClient('/auth/api/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        // La lógica de éxito sigue igual
        localStorage.setItem('authToken', result.token);
        setToken(result.token);
        setUsername('');
        setPassword('');
    } catch (err) {
        // apiClient ya lanza el error, así que el catch funciona igual
        console.error("Error al iniciar sesión:", err);
        setLoginError(err.message || 'Error de inicio de sesión');
    }
};

  // Effect to fetch data after login or on token change
useEffect(() => {
    if (token) {
        const fetchData = async () => {
            setError('');
            try {
                // The API call is now a single, clean line.
                // apiClient handles the base URL and Authorization header automatically.
                const result = await apiClient('/api/caja/estado/');
                setData(result);
            } catch (err) {
                console.error("Error al obtener datos de la API:", err);
                setError(err.message);
                
                // This error handling logic still works perfectly
                // because apiClient throws an error with a meaningful message.
                if (err.message.includes('Credenciales de autenticación no se proveyeron') || err.message.includes('Token inválido')) {
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
      // Llama al endpoint de logout del backend para invalidar el token
      await apiClient('/auth/api/logout/', {
        method: 'POST',
      });
    } catch (err) {
      // Si el servidor falla, la sesión local se cerrará de todos modos.
      // El error se registra en la consola para depuración.
      console.error("Error al cerrar sesión en el servidor:", err);
    }
    
    // Limpia el estado local y el token del navegador
    localStorage.removeItem('authToken');
    setToken('');
    setData(null);
    setError('');
    setLoginError('');
  };

  return (
    <div style={{ border: '2px dashed #007bff', padding: '1rem', margin: '1rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
      <h2 style={{ color: '#007bff' }}>Prueba de Integración Frontend-Backend</h2>

      {!token ? (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
          <h3>Iniciar Sesión</h3>
          {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
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
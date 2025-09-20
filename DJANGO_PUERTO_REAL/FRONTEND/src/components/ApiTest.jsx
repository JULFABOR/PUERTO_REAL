import { useState, useEffect } from 'react';

function ApiTest() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');

  // Function to handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setError('');

    try {
      const response = await fetch('/auth/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.non_field_errors ? errData.non_field_errors[0] : 'Error de inicio de sesión');
      }

      const result = await response.json();
      localStorage.setItem('authToken', result.token);
      setToken(result.token);
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setLoginError(err.message);
    }
  };

  // Effect to fetch data after login or on token change
  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        setError('');
        try {
          const response = await fetch('/api/caja/estado/', {
            headers: {
              'Authorization': `Token ${token}`,
            },
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail ? errData.detail : 'La respuesta de la red no fue exitosa. Status: ' + response.status);
          }

          const result = await response.json();
          setData(result);
        } catch (err) {
          console.error("Error al obtener datos de la API:", err);
          setError(err.message);
          // If token is invalid, clear it
          if (err.message.includes('Credenciales de autenticación no se proveyeron') || err.message.includes('Token inválido')) {
            localStorage.removeItem('authToken');
            setToken('');
          }
        }
      };
      fetchData();
    }
  }, [token]);

  const handleLogout = () => {
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
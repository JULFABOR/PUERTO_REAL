import { useState, useEffect } from 'react';

function ApiTest() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // El proxy de Vite está configurado para /api.
    // La URL de Django es /api/saludo/ dentro de la app HOME.
    // El archivo urls.py principal probablemente incluye las urls de HOME bajo "home/".
    // Por lo tanto, la URL final es /api/home/api/saludo/
    fetch('/api/home/api/saludo/')
      .then(response => {
        if (!response.ok) {
          throw new Error('La respuesta de la red no fue exitosa. Status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.mensaje);
      })
      .catch(err => {
        console.error("Error al obtener datos de la API:", err);
        setError('Error al cargar el mensaje de la API. Revisa la consola del navegador (F12) para más detalles.');
      });
  }, []);

  return (
    <div style={{ border: '2px dashed #007bff', padding: '1rem', margin: '1rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
      <h2 style={{ color: '#007bff' }}>Prueba de Integración Frontend-Backend</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>Mensaje del Backend: <strong>{message || 'Cargando...'}</strong></p>
      )}
    </div>
  );
}

export default ApiTest;

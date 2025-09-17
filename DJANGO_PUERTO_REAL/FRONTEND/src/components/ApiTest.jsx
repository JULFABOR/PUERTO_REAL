import { useState, useEffect } from 'react';

function ApiTest() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // El proxy de Vite está configurado para /api.
    // La URL de Django es /caja/estado/ dentro de la app Abrir_Cerrar_CAJA.
    // Asumiendo que las urls de la app se incluyen bajo "abrircerrarcaja/"
    fetch('/api/abrircerrarcaja/caja/estado/')
      .then(response => {
        if (!response.ok) {
          throw new Error('La respuesta de la red no fue exitosa. Status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        setData(data);
      })
      .catch(err => {
        console.error("Error al obtener datos de la API:", err);
        setError('Error al cargar los datos de la API. Revisa la consola del navegador (F12) para más detalles.');
      });
  }, []);

  return (
    <div style={{ border: '2px dashed #007bff', padding: '1rem', margin: '1rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
      <h2 style={{ color: '#007bff' }}>Prueba de Integración Frontend-Backend</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div>
          <p>Datos del Backend:</p>
          <pre>{JSON.stringify(data, null, 2) || 'Cargando...'}</pre>
        </div>
      )}
    </div>
  );
}

export default ApiTest;
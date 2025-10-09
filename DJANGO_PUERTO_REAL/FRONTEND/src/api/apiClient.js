const getAuthToken = () => localStorage.getItem('authToken');

const apiClient = async (url, options = {}) => {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        // Cambia la palabra 'Bearer' por 'Token'
        headers['Authorization'] = `Token ${token}`;
    }

    // La lógica de 'baseUrl' y 'fullUrl' se elimina.
    // Ahora confiamos en el proxy de Vite configurado en vite.config.js.
    // El parámetro 'url' debe ser una ruta relativa como '/api/users' o '/auth/api/login/'.

    try {
        const response = await fetch(url, { // <-- Ahora usa 'url' directamente
            ...options,
            headers,
        });

        if (!response.ok) {
            // Intenta parsear la respuesta de error del backend
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.detail || errorData.message || 'An error occurred');
        }

        // Si la respuesta no tiene contenido, devuelve null, de lo contrario, parsea el JSON
        if (response.status === 204 /* No Content */) {
            return null;
        }
        return response.json();

    } catch (error) {
        console.error('API Client Error:', error);
        // Re-lanza el error para que el componente pueda manejarlo
        throw error;
    }
};

export default apiClient;
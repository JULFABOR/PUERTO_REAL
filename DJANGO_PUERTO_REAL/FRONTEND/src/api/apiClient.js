
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

    // In a Vite project, VITE_API_BASE_URL can be set in the .env file
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const fullUrl = `${baseUrl}${url}`;

    try {
        const fetchOptions = {
            ...options,
            headers,
        };

        // For GET requests, disable caching to ensure fresh data
        if (!options.method || options.method.toUpperCase() === 'GET') {
            fetchOptions.cache = 'no-cache';
        }

        const response = await fetch(fullUrl, fetchOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            const error = new Error('API request failed');
            error.response = response;
            error.data = errorData;
            throw error;
        }

        // If response has no content, return null, otherwise parse JSON
        if (response.status === 204 /* No Content */) {
            return null;
        }
        return response.json();

    } catch (error) {
        console.error('API Client Error:', error);
        // Re-throw the error so component can handle it
        throw error;
    }
};

export default apiClient;

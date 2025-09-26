
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
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // Try to parse error response from the backend
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.detail || errorData.message || 'An error occurred');
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

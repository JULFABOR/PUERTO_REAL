import axios from 'axios';
import { toast } from 'react-hot-toast'; 

const getAuthToken = () => {
  // Compatibilidad: algunas partes antiguas guardaban el token en 'token'
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

const apiClient = axios.create({
  // Aseguramos que apunte al puerto de Django
  baseURL: 'http://127.0.0.1:8000/api', 
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Configuración necesaria para que Django acepte la conexión
  withCredentials: true, 
  xsrfCookieName: 'csrftoken', 
  xsrfHeaderName: 'X-CSRFToken', 
});

// --- INTERCEPTOR DE PETICIONES ---
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      // CORRECCIÓN CRÍTICA: 
      // Tu settings.py usa 'TokenAuthentication', por lo tanto 
      // el prefijo OBLIGATORIO aquí es 'Token'. 
      // (Si pusiéramos 'Bearer', Django rechazaría la conexión -> Error 401 -> Recarga).
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTAS ---
apiClient.interceptors.response.use(
  (response) => response, 
  (error) => {
    const { status, config } = error.response || {};

    // LÓGICA ANTIBUCLE DE RECARGA:
    // Si falla el Login o la validación del usuario (/me/), NO recargamos la página.
    // Solo recargamos si falla una petición normal (como ver productos) por token vencido.
    const isLoginEndpoint = config?.url?.includes('/auth/login/');
    const isUserEndpoint = config?.url?.includes('/auth/user/me/');

    if (status === 401 && !isLoginEndpoint && !isUserEndpoint) { 
      
      console.warn("Sesión expirada, cerrando sesión...");
      localStorage.removeItem('authToken');
      localStorage.removeItem('user'); 
      
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      
      // Forzamos la salida al login
      window.location.href = '/'; 
    }
    
    // Devolvemos el error para que el componente pueda mostrar el mensaje "Contraseña incorrecta"
    return Promise.reject(error);
  }
);

export default apiClient;
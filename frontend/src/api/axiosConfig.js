import axios from 'axios';

const API_GESTION = axios.create({
    baseURL: '/api/gestion',
    headers: { 'Content-Type': 'application/json' }
});

const API_INSPECCION = axios.create({
    baseURL: '/api/inspeccion',
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor para agregar token automáticamente
const addAuthInterceptor = (instance) => {
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

addAuthInterceptor(API_GESTION);
addAuthInterceptor(API_INSPECCION);

export { API_GESTION, API_INSPECCION };
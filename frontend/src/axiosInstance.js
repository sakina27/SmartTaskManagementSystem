import axios from 'axios';

export const taskServiceApi = axios.create({
    baseURL: 'https://taskmanager.com:30443/api/',
});

export const userServiceApi = axios.create({
    baseURL: 'https://taskmanager.com:30443/api/',
});

export const commentServiceApi = axios.create({
    baseURL: 'https://taskmanager.com:30443/api/',
});

export const notificationServiceApi = axios.create({
    baseURL: 'https://taskmanager.com:30443/api/',
});

// Function to add interceptor for auth token
function addAuthInterceptor(apiInstance) {
    apiInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );
}

// Add interceptor to all axios instances
addAuthInterceptor(taskServiceApi);
addAuthInterceptor(userServiceApi);
addAuthInterceptor(commentServiceApi);
addAuthInterceptor(notificationServiceApi);

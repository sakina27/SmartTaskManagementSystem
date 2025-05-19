import axios from 'axios';

// Create axios instances for each service
export const taskServiceApi = axios.create({
    baseURL: 'http://localhost:8081/api',
});

export const userServiceApi = axios.create({
    baseURL: 'http://localhost:8082/api',
});

export const commentServiceApi = axios.create({
    baseURL: 'http://localhost:8083/api',
});

export const notificationServiceApi = axios.create({
    baseURL: 'http://localhost:8084/api',
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

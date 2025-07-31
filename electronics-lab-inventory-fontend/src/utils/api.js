// src/utils/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Your backend URL
    withCredentials: true,
});

// Interceptor to attach token for authenticated requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Assuming JWT token is stored here
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor for handling token expiration/unauthorized responses
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Handle unauthorized access or expired token, e.g., redirect to login
        console.error('Unauthorized access. Redirecting to login...');
        localStorage.removeItem('token');
        // You would typically use react-router-dom's history here
        window.location.href = '/login'; // Simple redirect for now
    }
    return Promise.reject(error);
});




export default api;
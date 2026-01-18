import axios from 'axios';

// Base API URL - pointing to Auth Service by default for auth
// We will have separate instances or URLs for other services
const API_URL = 'http://localhost:8001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const searchApi = axios.create({
    baseURL: 'http://localhost:8002',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const executeSearch = async (queryStr, communityId = null, limit = 10, threshold = 10.0) => {
    try {
        const payload = {
            query: queryStr,
            limit: limit,
            threshold: threshold
        };
        if (communityId && communityId !== 'All' && communityId !== 'Global') {
            payload.community_id = String(communityId);
        }

        const response = await searchApi.post('/search', payload);
        return response.data;
    } catch (error) {
        console.error("Error executing search:", error);
        throw error;
    }
};

export const executeChat = async (queryStr, history = [], communityId = null, limit = 5, threshold = 10.0) => {
    try {
        const payload = {
            query: queryStr,
            history: history,
            limit: limit,
            threshold: threshold
        };
        if (communityId && communityId !== 'All' && communityId !== 'Global') {
            payload.community_id = String(communityId);
        }

        const response = await searchApi.post('/chat', payload);
        return response.data;
    } catch (error) {
        console.error("Error executing chat:", error);
        throw error;
    }
};

export default api;

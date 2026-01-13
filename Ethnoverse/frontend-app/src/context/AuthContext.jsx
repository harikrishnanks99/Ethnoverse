import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('userId');

        if (token && username) {
            setUser({ username, id: userId });
        }
        setLoading(false);
    }, []);

    const login = async (username_or_email, password) => {
        try {
            const response = await api.post('/login', {
                username_or_email,
                password,
            });

            const { access_token } = response.data;

            // Decode token to get user ID/Info in a real app, 
            // but for now we'll just store the token.
            // We might need a separate /me endpoint to get user details properly.
            // For now, let's assume successful login implies we have the user.

            localStorage.setItem('token', access_token);
            localStorage.setItem('username', username_or_email); // simplistic
            // In reality, we should parse the JWT or call /me

            setUser({ username: username_or_email });
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/register', userData);
            return true;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

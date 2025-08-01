// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/api/auth/me');
                    if (res.data.success) {
                        setUser(res.data.data);
                    } else {
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', {
            email,
            password
        });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.data);
        }
        return res.data;
    };

    const logout = async () => {
        await api.get('/api/auth/logout');
        localStorage.removeItem('token');
        setUser(null);
    };

    return ( <AuthContext.Provider value = {
            {
                user,
                isAuthenticated: !!user,
                loading,
                login,
                logout,
                setUser
            }
        } > {
            children
        } </AuthContext.Provider>
    );
};

export default AuthContext;
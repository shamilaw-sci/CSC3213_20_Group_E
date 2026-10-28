import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

// Create Context
const UserAuthContext = createContext();

// Create Provider Component
export const UserAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the currently authenticated user from the backend using the HttpOnly cookie
        const verifyUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                // If 401/404, the user is not logged in or the cookie expired
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, []);

    // Login with email and password
    const login = async (emailOrUserData, password) => {
        if (typeof emailOrUserData === 'object' && emailOrUserData !== null) {
            setUser(emailOrUserData);
            return emailOrUserData;
        }
        const response = await api.post('/auth/login', { email: emailOrUserData, password });
        setUser(response.data.user);
        return response.data;
    };

    // Login with Google ID Token credential
    const loginWithGoogle = async (credential) => {
        const response = await api.post('/auth/google', { credential });
        setUser(response.data.user);
        return response.data;
    };

    // Logout function hits the backend to clear the cookie and resets state
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error.response?.data?.message || error.message);
        } finally {
            setUser(null);
        }
    };

    const setUserData = (userData) => {
        setUser(userData);
    };

    return (
        <UserAuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, setUserData }}>
            {!loading && children}
        </UserAuthContext.Provider>
    );
};

// Custom Hook to use the Auth Context easily in any component
export const useAuth = () => {
    return useContext(UserAuthContext);
};

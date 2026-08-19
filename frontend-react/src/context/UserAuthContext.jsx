import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';

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

    // Login function updates the state after successful authentication
    const login = (userData) => {
        setUser(userData);
    };

    // Logout function hits the backend to clear the cookie and resets state
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            (toast.error('Logout error:'), console.error('Logout error:', error));
        } finally {
            setUser(null);
            // Optionally redirect to home or login here if not handled in the component
        }
    };

    return (
        <UserAuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </UserAuthContext.Provider>
    );
};

// Custom Hook to use the Auth Context easily in any component
export const useAuth = () => {
    return useContext(UserAuthContext);
};

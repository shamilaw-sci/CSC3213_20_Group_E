import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './UserAuthContext';
import api from './api';
import toast from 'react-hot-toast';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    
    // Default to system preference if nothing is saved
    const [theme, setTheme] = useState('system'); 
    const [isDark, setIsDark] = useState(false);

    // Apply theme to document element
    useEffect(() => {
        const root = window.document.documentElement;
        
        const applyTheme = (currentTheme) => {
            root.classList.remove('light', 'dark');
            if (currentTheme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
                setIsDark(systemTheme === 'dark');
            } else {
                root.classList.add(currentTheme);
                setIsDark(currentTheme === 'dark');
            }
        };

        applyTheme(theme);

        // Listen for system theme changes dynamically
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // When user logs in, load their preference from state (if we fetched it)
    useEffect(() => {
        if (user && user.theme_preference) {
            setTheme(user.theme_preference);
        } else if (!user) {
            // Reset to system if logged out
            setTheme('system');
        }
    }, [user]);

    const changeTheme = async (newTheme) => {
        setTheme(newTheme);
        // If user is logged in, save to backend
        if (user) {
            try {
                await api.put('/auth/profile', { theme_preference: newTheme }); // baseURL already includes /api
            } catch (error) {
                (toast.error("Failed to save theme preference:"), console.error("Failed to save theme preference:", error));
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

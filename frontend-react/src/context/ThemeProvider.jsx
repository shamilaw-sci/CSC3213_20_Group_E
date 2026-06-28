import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './UserAuthContext';
import api from './api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    
    // Default to system preference if nothing is saved
    const [theme, setTheme] = useState('system'); 
    const [isDark, setIsDark] = useState(false);

    // Apply theme to document element
    useEffect(() => {
        const root = window.document.documentElement;
        
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
            setIsDark(systemTheme === 'dark');
        } else {
            root.classList.add(theme);
            setIsDark(theme === 'dark');
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
                await api.put('/api/auth/profile', { theme_preference: newTheme });
            } catch (error) {
                console.error("Failed to save theme preference:", error);
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

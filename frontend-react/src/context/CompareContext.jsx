import { logClientError } from '../utils/clientLog';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export function CompareProvider({ children }) {
    const [compareList, setCompareList] = useState(() => {
        try {
            const saved = localStorage.getItem('compareList');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('compareList', JSON.stringify(compareList));
        } catch (e) {
            logClientError('compare_storage_write_failed');
        }
    }, [compareList]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'compareList') {
                try {
                    setCompareList(e.newValue ? JSON.parse(e.newValue) : []);
                } catch {
                    setCompareList([]);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const addToCompare = (property) => {
        if (compareList.find(p => p.id === property.id)) return; // Already exists
        if (compareList.length >= 3) {
            alert("You can only compare up to 3 properties at a time.");
            return;
        }
        setCompareList([...compareList, property]);
    };

    const removeFromCompare = (propertyId) => {
        setCompareList(compareList.filter(p => p.id !== propertyId));
        if (compareList.length <= 1) {
            setIsCompareOpen(false); // Auto close if no properties left
        }
    };

    const clearCompare = () => {
        setCompareList([]);
        setIsCompareOpen(false);
    };

    return (
        <CompareContext.Provider value={{
            compareList,
            addToCompare,
            removeFromCompare,
            clearCompare,
            isCompareOpen,
            setIsCompareOpen
        }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    return useContext(CompareContext);
}

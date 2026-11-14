import { useCallback, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';

const keys = ['extractSearch', 'titleRegistration', 'surveyPlan', 'streetLine', 'nonVesting', 'encumbranceFree'];
const empty = JSON.stringify({ extractSearch: true, surveyPlan: true });
const eventName = 'thirasara-checklist-change';
function subscribe(callback) {
    window.addEventListener('storage', callback);
    window.addEventListener(eventName, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(eventName, callback);
    };
}
export default function useDueDiligence(userId) {
    const storageKey = userId ? `thirasara:due-diligence:${userId}` : null;
    const read = useCallback(() => {
        try { return storageKey ? localStorage.getItem(storageKey) || empty : empty; }
        catch { return empty; }
    }, [storageKey]);
    const raw = useSyncExternalStore(subscribe, read, () => empty);
    let saved;
    try { saved = JSON.parse(raw); } catch { saved = {}; }
    const checkedItems = Object.fromEntries(keys.map(key => [key, saved?.[key] === true]));
    const toggleCheckItem = key => {
        if (!storageKey || !keys.includes(key)) return;
        try {
            let latest;
            try { latest = JSON.parse(read()); } catch { latest = {}; }
            const next = Object.fromEntries(keys.map(item => [item, latest?.[item] === true]));
            next[key] = !next[key];
            localStorage.setItem(storageKey, JSON.stringify(next));
            window.dispatchEvent(new Event(eventName));
        } catch { toast.error('Could not save your checklist in this browser.'); }
    };
    return { checkedItems, toggleCheckItem };
}

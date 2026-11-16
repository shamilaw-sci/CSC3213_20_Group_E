import { useEffect, useState } from 'react';

export const CONSENT_KEY = 'thirasara:cookie-preferences';
export const CONSENT_TTL = 180 * 24 * 60 * 60 * 1000;
const EVENT = 'thirasara:consent-change';
let sessionChoice = null;
export function readConsent() {
  try {
    const value = sessionChoice || JSON.parse(localStorage.getItem(CONSENT_KEY));
    if (value?.version !== 1 || typeof value.social !== 'boolean' || typeof value.media !== 'boolean' || !Number.isFinite(value.savedAt) || value.savedAt > Date.now() || Date.now() - value.savedAt >= CONSENT_TTL) return null;
    return value;
  } catch { return null; }
}
export function saveConsent(choices) {
  const value = { version: 1, social: choices.social === true, media: choices.media === true, savedAt: Date.now() };
  let persisted = true;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch { persisted = false; }
  sessionChoice = persisted ? null : value;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return persisted;
}
export function openCookieSettings() { window.dispatchEvent(new Event('thirasara:open-cookie-settings')); }
export function useConsent() {
  const [consent, setConsent] = useState(readConsent);
  useEffect(() => {
    const changed = event => setConsent(event.detail);
    const storage = event => { if (event.key === CONSENT_KEY || event.key === null) setConsent(readConsent()); };
    window.addEventListener(EVENT, changed);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(EVENT, changed); window.removeEventListener('storage', storage); };
  }, []);
  useEffect(() => {
    if (!consent) return;
    let timer;
    const expire = () => {
      const remaining = CONSENT_TTL - (Date.now() - consent.savedAt);
      if (remaining <= 0) setConsent(null);
      else timer = setTimeout(expire, Math.min(remaining, 2147483647));
    };
    expire();
    return () => clearTimeout(timer);
  }, [consent]);
  return consent;
}

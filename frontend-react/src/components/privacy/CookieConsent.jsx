import React, { useEffect, useState } from 'react';
import { ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { openCookieSettings, saveConsent, useConsent } from './consentStore';
import './cookieConsent.css';

export default function CookieConsent() {
  const consent = useConsent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ social: false, media: false });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const show = () => { setDraft({ social: consent?.social ?? false, media: consent?.media ?? false }); setOpen(true); };
    window.addEventListener('thirasara:open-cookie-settings', show);
    return () => window.removeEventListener('thirasara:open-cookie-settings', show);
  }, [consent]);
  const choose = choices => {
    const revoke = (consent?.social && !choices.social) || (consent?.media && !choices.media);
    if (revoke && !window.confirm('Apply these changes and reload the page? Finish or close any active payment first. Other unsaved changes may be lost.')) return;
    const persisted = saveConsent(choices);
    setOpen(false);
    if (!persisted) setNotice('Your choice applies to this tab. Browser storage is unavailable, so it cannot be remembered. Already loaded services may remain until you close this tab.');
    if (revoke && persisted) window.location.reload();
  };
  return <>
    {!consent && !open && <section className="cookie-banner" aria-label="Cookie preferences">
      <div className="cookie-mark"><ShieldCheck size={24} aria-hidden="true" /></div>
      <div className="cookie-copy"><span className="cookie-eyebrow">THIRASARA · YOUR PRIVACY</span><h2>Your privacy, your choice</h2><p>We use essential storage to keep you signed in. Choose whether to enable social sign-in and external videos. You can change your choice anytime.</p></div>
      <div className="cookie-actions"><button className="cookie-primary" onClick={() => choose({ social: true, media: true })}>Accept optional</button><button className="cookie-secondary" onClick={() => choose({ social: false, media: false })}>Reject optional</button><button className="cookie-link" onClick={openCookieSettings}>Cookie settings</button></div>
    </section>}
    {(consent || open) && <button className="cookie-reopen" onClick={openCookieSettings} aria-label="Cookie settings"><SlidersHorizontal size={15} aria-hidden="true" /><span>Privacy choices</span></button>}
    {notice && <p className="cookie-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss privacy notice">×</button></p>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="cookie-dialog">
        <span className="cookie-eyebrow">MAKE YOURSELF AT HOME</span>
        <DialogTitle>Privacy, on your terms.</DialogTitle>
        <DialogDescription>Choose the optional services you want to use. Your choice is remembered on this browser for 180 days.</DialogDescription>
        <div className="cookie-category"><div><h3>Essential storage</h3><p>Login sessions, security, your privacy choice and features you request, such as comparison and checklists.</p></div><span className="cookie-required">Always active</span></div>
        <label className="cookie-category"><div><h3>Social sign-in</h3><p>Allow Google sign-in to load on the login page. Email and password work without this.</p></div><input type="checkbox" checked={draft.social} onChange={event => setDraft({ ...draft, social: event.target.checked })} /></label>
        <label className="cookie-category"><div><h3>External videos</h3><p>Allow embedded YouTube videos. The provider may use cookies and receive device information.</p></div><input type="checkbox" checked={draft.media} onChange={event => setDraft({ ...draft, media: event.target.checked })} /></label>
        <p className="cookie-disclosure">Maps and property images contact their hosting providers when displayed. PayHere loads when you request payment and may use its own security and analytics cookies. Rejecting optional services does not block these requested features or remove cookies held by other websites. Disabling a previously enabled service reloads this page.</p>
        <div className="cookie-dialog-actions"><button className="cookie-secondary" onClick={() => choose({ social: false, media: false })}>Reject optional</button><button className="cookie-primary" onClick={() => choose(draft)}>Save preferences</button></div>
      </DialogContent>
    </Dialog>
  </>;
}

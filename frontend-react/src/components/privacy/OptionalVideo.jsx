import React from 'react';
import { openCookieSettings, useConsent } from './consentStore';
export default function OptionalVideo({ children }) {
  const consent = useConsent();
  if (consent?.media) return children;
  return <div className="h-full min-h-48 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200"><p className="text-sm">This video is hosted by YouTube. Enable external videos to watch it.</p><button type="button" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white" onClick={openCookieSettings}>Video privacy settings</button></div>;
}

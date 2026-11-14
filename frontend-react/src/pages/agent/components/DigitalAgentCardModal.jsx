import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  Share2, 
  Mail, 
  Award, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Video, 
  QrCode, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  PlayCircle, 
  Globe, 
  Check, 
  X, 
  UserCheck, 
  Send,
  Bed,
  Bath,
  Maximize,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Edit3,
  Sliders,
  Save,
  Layers,
  KeyRound,
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  User,
  Smartphone,
  Link as LinkIcon
} from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import toast from 'react-hot-toast';


const DigitalAgentCardModal = ({ agent, profile, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrType, setQrType] = useState('vcard'); // 'vcard' | 'web'
  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Profile URL copied to clipboard!");
  };

  // Full Standard vCard 3.0 string
  const vCardContent = `BEGIN:VCARD
VERSION:3.0
N:${agent.name};;;;
FN:${agent.name}
ORG:${profile.agency_name || 'Certified Real Estate Broker'}
TITLE:Licensed Real Estate Agent
TEL;TYPE=CELL,VOICE:${agent.phone || ''}
EMAIL;TYPE=INTERNET,PREF:${agent.email || ''}
URL:${currentUrl}
NOTE:Certified Thirasara Real Estate Agent. License: ${profile.license_number || 'CEA-SL'}
END:VCARD`;

  // Dynamic QR Code data:
  // When 'vcard' is selected, QR directly encodes contact details so iPhone/Android camera opens "Add to Contacts"!
  const qrEncodedData = qrType === 'vcard' ? vCardContent : currentUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(qrEncodedData)}`;

  const handleDownloadVCard = () => {
    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${agent.name.replace(/\s+/g, '_')}_Agent.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Contact VCard downloaded!");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Hello! Check out the official real estate portfolio of ${agent.name} (${profile.agency_name || 'Certified Broker'}): ${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center font-black mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Digital Agent Card & QR Code
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
          Scan with your phone camera to instantly save contact details
        </p>

        {/* QR Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setQrType('vcard')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              qrType === 'vcard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Save Contact (vCard)</span>
          </button>

          <button
            type="button"
            onClick={() => setQrType('web')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              qrType === 'web'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Web Profile Link</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner inline-block mb-4">
          <img src={qrImageUrl} alt="Agent Profile QR Code" className="w-48 h-48 rounded-xl object-contain mx-auto" />
          <span className="text-[10px] font-bold text-slate-500 mt-2 block">
            {qrType === 'vcard' ? '📱 Mobile Camera: Opens "Save to Contacts"' : '🌐 Mobile Browser: Opens Web Profile'}
          </span>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadVCard}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Save Contact (.vcf)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Share WhatsApp
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── 4. Write Client Review Modal ───────────────────────────────────────────────────

export default DigitalAgentCardModal;

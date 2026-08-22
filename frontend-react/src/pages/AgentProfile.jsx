import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
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
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';

// Curated luxury preset cover banners
const PRESET_COVERS = [
  {
    name: 'Modern Villa',
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'Colombo Skyline',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'Coastal Oceanfront',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'Colonial Architecture',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'
  }
];

// ── 1. In-Situ Live Agent Customization Studio Modal ──────────────────────────────
const AgentCustomizationStudioModal = ({ agent, profile, onClose, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState('brand');
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    avatar_url: agent?.avatar_url || '',
    cover_image_url: profile?.cover_image_url || '',
    agency_name: profile?.agency_name || '',
    license_number: profile?.license_number || '',
    specialization: profile?.specialization || 'Both Sales & Rentals',
    service_areas: profile?.service_areas || 'Colombo 03-07, Greater Colombo',
    languages: profile?.languages || 'English, Sinhala',
    total_sales: profile?.total_sales ?? 14,
    total_rentals: profile?.total_rentals ?? 28,
    youtube_video_url: profile?.youtube_video_url || '',
    bio: profile?.bio || ''
  });

  const handleAvatarFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result }));
        toast.success("Profile photo loaded! Click Save to publish.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, cover_image_url: reader.result }));
        toast.success("Cover banner loaded! Click Save to publish.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/agents/profile', {
        ...formData,
        total_sales: Number(formData.total_sales) || 0,
        total_rentals: Number(formData.total_rentals) || 0
      });
      toast.success("Agent profile, imagery & branding updated successfully!");
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update agent profile.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { 
      key: 'brand', 
      label: 'Brand & Visual Identity', 
      desc: 'Avatar, cover banner, agency & license',
      icon: Building2 
    },
    { 
      key: 'territory', 
      label: 'Territory & Languages', 
      desc: 'Covered districts & spoken languages',
      icon: MapPin 
    },
    { 
      key: 'metrics', 
      label: 'Deals & Track Record', 
      desc: 'Properties sold & rental volume',
      icon: TrendingUp 
    },
    { 
      key: 'media', 
      label: 'HD Video Reel & Bio', 
      desc: 'YouTube video walkthrough & biography',
      icon: Video 
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Studio Top Header */}
        <div className="px-6 sm:px-8 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Agent Brand & Profile Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider">
                  Live Customizer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize your profile photos, cover banners, accreditation, and deal volume
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Studio 2-Column Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sidebar: Navigation Tabs */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0 overflow-x-auto md:overflow-y-auto space-y-1.5 custom-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 hidden md:block mb-2">
              Studio Sections
            </span>

            <div className="flex md:flex-col gap-1.5">
              {tabs.map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer shrink-0 md:shrink ${
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/30 font-bold'
                      : 'bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black block truncate">{label}</span>
                    <span className={`text-[10px] block truncate mt-0.5 ${activeTab === key ? 'text-blue-100' : 'text-slate-400'}`}>
                      {desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Form Fields Studio */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900">
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              
              {/* TAB 1: Brand & Visual Identity */}
              {activeTab === 'brand' && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-3xl">
                  
                  {/* Visual Imagery Studio (Avatar + Cover) */}
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-500" />
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Profile Imagery & Cover Banner</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">Live Visual Presentation</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Avatar Upload */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Agent Profile Headshot
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-md shrink-0 relative group">
                            <img
                              src={formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Agent')}&size=200&background=2563eb&color=fff`}
                              alt="Agent Headshot"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              ref={avatarInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarFileChange}
                            />
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" /> Upload Photo
                            </button>
                            {formData.avatar_url && (
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                                className="text-[11px] text-red-500 hover:underline block font-semibold"
                              >
                                Reset to Default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cover Banner Customizer */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Hero Cover Banner
                        </label>
                        <div className="space-y-2">
                          <div className="h-20 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-slate-200 dark:border-slate-700 relative shadow-inner">
                            {formData.cover_image_url ? (
                              <img src={formData.cover_image_url} alt="Cover Banner Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-white/70 font-semibold">
                                Executive Gradient (Default)
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={coverInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverFileChange}
                            />
                            <button
                              type="button"
                              onClick={() => coverInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Upload Banner
                            </button>
                            {formData.cover_image_url && (
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                                className="text-[11px] text-slate-500 hover:underline font-semibold"
                              >
                                Use Gradient
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Quick Preset Cover Selector */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Or Pick a Luxury Real Estate Preset Banner:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PRESET_COVERS.map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, cover_image_url: preset.url }))}
                            className={`h-14 rounded-xl overflow-hidden border-2 transition-all relative group cursor-pointer ${
                              formData.cover_image_url === preset.url
                                ? 'border-blue-500 ring-2 ring-blue-500/30'
                                : 'border-transparent hover:border-slate-400'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-black/20 transition">
                              {preset.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Agency & Accreditation Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Agency / Brokerage Firm Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mark Lands Real Estate / Apex Realty Prime"
                        value={formData.agency_name}
                        onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Official CEA / Broker License No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CEA-SL-2026-LS001"
                          value={formData.license_number}
                          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Displays on the Verified License badge</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Asset Specialization
                        </label>
                        <select
                          value={formData.specialization}
                          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-semibold"
                        >
                          <option value="Both Sales & Rentals">Both Sales & Rentals</option>
                          <option value="Sales Only">Sales Only</option>
                          <option value="Rentals Only">Rentals Only</option>
                          <option value="Luxury Villas & Estates">Luxury Villas & Estates</option>
                          <option value="Commercial & Industrial Land">Commercial & Industrial Land</option>
                        </select>
                        <span className="text-[11px] text-slate-400 mt-1 block">Categorizes your profile in search filters</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: Territory & Languages */}
              {activeTab === 'territory' && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Territory Coverage & Communication</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Specify your active operational areas and client languages</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Covered Service Districts (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo 03-07, Kandy, Galle Coast, Maharagama, Negombo"
                      value={formData.service_areas}
                      onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      These districts appear as verified location badges on your public showcase and power client search matching.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Languages Spoken (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. English, Sinhala, Tamil"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Track Record */}
              {activeTab === 'metrics' && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Performance Metrics & Deal Volume</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Showcase your verified sales and rental transaction volume</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Total Properties Sold (Deals Closed)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 14"
                        value={formData.total_sales}
                        onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-black focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        Pillar 1: Verified Sales Closed
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Total Rentals Managed
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 28"
                        value={formData.total_rentals}
                        onChange={(e) => setFormData({ ...formData, total_rentals: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-black focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                        Pillar 2: Rentals Transacted
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Media & Story */}
              {activeTab === 'media' && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Video Tour & Biography</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Embed agency video walkthrough and author your story</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      YouTube Video Walkthrough / Agency Intro URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.youtube_video_url}
                      onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Renders an interactive HD video player on your public profile</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Professional Biography & Background
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Introduce yourself, your market expertise, negotiation style, and notable property transactions..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Studio Bottom Action Footer */}
            <div className="px-6 sm:px-8 py-4.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/90 shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel & Close
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save & Publish Changes</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};

// ── 2. Book Viewing & Consultation Modal ──────────────────────────────────────────
const BookViewingModal = ({ agent, listings, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    client_name: user?.name || '',
    client_email: user?.email || '',
    client_phone: user?.phone || '',
    property_id: listings?.[0]?.id || '',
    viewing_type: 'In-Person Property Tour',
    preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferred_time: 'Morning (9:00 AM - 12:00 PM)',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_email || !formData.client_phone) {
      toast.error("Please fill in your contact details.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/agents/${agent.id}/book-viewing`, formData);
      toast.success("Viewing request scheduled! The agent will confirm shortly.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit viewing request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Book Viewing / Consultation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct scheduling with <strong className="text-slate-800 dark:text-slate-200">{agent.name}</strong>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Your Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Nimal Perera"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="e.g. 0771234567"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. nimal@example.com"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Meeting Format</label>
              <select
                value={formData.viewing_type}
                onChange={(e) => setFormData({ ...formData, viewing_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="In-Person Property Tour">In-Person Property Tour</option>
                <option value="Live Video Walkthrough">Live Video Walkthrough</option>
                <option value="Investment Consultation">Investment Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Select Property (Optional)</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">General Portfolio Inquiry</option>
                {listings?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title?.slice(0, 35)}... (Rs. {Number(p.price || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Preferred Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Preferred Time Window</label>
              <select
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Special Requirements or Questions</label>
            <textarea
              rows={2}
              placeholder="e.g. Interested in title deeds inspection, nearby school boundaries..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Confirm & Book Appointment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

// ── 3. Digital Agent VCard & QR Code Modal ───────────────────────────────────────
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
const WriteReviewModal = ({ agent, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter your review feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/agents/${agent.id}/reviews`, { rating, comment: comment.trim() });
      toast.success("Thank you! Your verified client review has been published.");
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review. Make sure you are signed in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Rate & Review Agent</h3>
              <p className="text-xs text-slate-500">{agent.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center py-2">
            <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Overall Client Rating</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-amber-500 mt-2 block">
              {rating === 5 ? "5.0 - Exceptional Service" : rating === 4 ? "4.0 - Very Good" : rating === 3 ? "3.0 - Satisfactory" : "Needs Improvement"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Your Feedback & Experience
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe your experience with this agent regarding responsiveness, market expertise, and deal negotiation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Publishing..." : "Submit Review"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────────
const AgentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const quickAvatarInputRef = useRef(null);
  const quickCoverInputRef = useRef(null);

  const [agentData, setAgentData] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);

  const fetchAgent = async () => {
    try {
      const response = await api.get(`/agents/${id}`);
      setAgentData(response.data.agent);
      setListings(response.data.listings || response.data.agent?.properties || []);
      setReviews(response.data.reviews || response.data.agent?.agent_reviews || []);
    } catch (error) {
      toast.error("Error fetching agent profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, [id]);

  // Quick In-Situ Avatar Upload
  const handleQuickAvatarUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await api.put('/agents/profile', { avatar_url: reader.result });
          toast.success("Profile headshot updated!");
          fetchAgent();
        } catch (err) {
          toast.error("Failed to update profile photo");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick In-Situ Cover Upload
  const handleQuickCoverUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await api.put('/agents/profile', { cover_image_url: reader.result });
          toast.success("Cover banner updated!");
          fetchAgent();
        } catch (err) {
          toast.error("Failed to update cover banner");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-outfit">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-outfit">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Agent Not Found</h2>
          <p className="text-slate-500 mb-6">The requested agent profile could not be located.</p>
          <button type="button" onClick={() => navigate('/agents')} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm">
            Browse All Agents
          </button>
        </div>
      </div>
    );
  }

  const profile = Array.isArray(agentData.agent_profiles) ? (agentData.agent_profiles[0] || {}) : (agentData.agent_profiles || {});
  const agencyName = profile.agency_name || 'Certified Real Estate Broker';
  const licenseNumber = profile.license_number || 'CEA-SL-2026';
  const coverImageUrl = profile.cover_image_url || null;
  const totalSales = profile.total_sales ?? 14;
  const totalRentals = profile.total_rentals ?? 28;
  const languages = profile.languages ? (Array.isArray(profile.languages) ? profile.languages : profile.languages.split(',')) : ['English', 'Sinhala'];
  const serviceAreas = profile.service_areas ? (Array.isArray(profile.service_areas) ? profile.service_areas : profile.service_areas.split(',')) : ['Colombo 03-07', 'Greater Colombo'];
  const specialization = profile.specialization || 'Both Sales & Rentals';

  const isOwner = user && agentData && (user.id === agentData.id || user.role === 'ADMIN');

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
  };

  const embedUrl = getEmbedUrl(profile.youtube_video_url);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await api.post(`/conversations/agent/${agentData.id}`);
      navigate(`/messages?conversation=${response.data.conversation.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start conversation.");
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-outfit selection:bg-blue-200">
      <Navbar />

      {/* Hidden File Inputs for In-Situ Quick Uploads */}
      <input type="file" ref={quickAvatarInputRef} accept="image/*" className="hidden" onChange={handleQuickAvatarUpload} />
      <input type="file" ref={quickCoverInputRef} accept="image/*" className="hidden" onChange={handleQuickCoverUpload} />

      {/* Modals */}
      {showStudioModal && (
        <AgentCustomizationStudioModal
          agent={agentData}
          profile={profile}
          onClose={() => setShowStudioModal(false)}
          onProfileUpdated={fetchAgent}
        />
      )}

      {showBookingModal && (
        <BookViewingModal
          agent={agentData}
          listings={listings}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {showQrModal && (
        <DigitalAgentCardModal
          agent={agentData}
          profile={profile}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {showReviewModal && (
        <WriteReviewModal
          agent={agentData}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={fetchAgent}
        />
      )}

      {/* Owner Mode Sticky Action Bar */}
      {isOwner && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-3 border-b border-blue-800 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Owner Mode Active: You are viewing your public Agent Profile</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/agent-dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>CRM Leads Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStudioModal(true)}
                className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Customize Profile Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <span>/</span>
            <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/agents')}>Certified Agents</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">{agentData.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowStudioModal(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Hub</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Digital VCard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Hero Banner Studio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Top Hero Cover Banner Holder (Supports Custom Image or Default Gradient) */}
          <div className="h-56 sm:h-64 lg:h-72 w-full relative overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 flex flex-col justify-between p-6">
            
            {coverImageUrl ? (
              <>
                <img 
                  src={coverImageUrl} 
                  alt="Agent Cover Banner" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40"></div>
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/60 via-indigo-950/80 to-slate-950"></div>
            )}

            {/* Banner Top Actions */}
            <div className="relative z-10 flex items-center justify-between w-full">
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => quickCoverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Cover Banner</span>
                </button>
              ) : <div></div>}

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified CEA License</span>
              </span>
            </div>

            {/* Banner Bottom Label */}
            <div className="relative z-10"></div>
          </div>

          {/* Profile Header Main Content (Separated from banner line with proper spacing) */}
          <div className="px-6 sm:px-10 pb-8 pt-0 relative bg-white dark:bg-slate-900">
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 -mt-20 sm:-mt-24 mb-6">
              
              {/* Headshot & Info Container */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                
                {/* Avatar with Camera Button */}
                <div className="relative shrink-0">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl bg-white dark:bg-slate-800 relative group">
                    <img
                      src={agentData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentData.name)}&size=300&background=2563eb&color=fff`}
                      alt={agentData.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => quickAvatarInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-all backdrop-blur-xs cursor-pointer font-bold text-xs"
                      >
                        <Camera className="w-6 h-6" />
                        <span>Change Photo</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900" title="Verified CEA Broker">
                    <Award className="w-4 h-4" />
                  </div>
                </div>

                {/* Text Information Block (Cleanly situated on white/dark card below the banner) */}
                <div className="pt-4 sm:pt-20 lg:pt-24 space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {agentData.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider">
                      PRO AGENT
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{agencyName}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-mono text-slate-500 font-bold">Lic: {licenseNumber}</span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">{averageRating}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">({reviews.length} client reviews)</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg">
                      {specialization}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Hub */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0 pt-2 lg:pt-24">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => setShowStudioModal(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Customize Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Site Viewing</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartChat}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Direct Chat</span>
                </button>

                {agentData.phone && (
                  <a
                    href={`tel:${agentData.phone}`}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    title="Direct Call"
                  >
                    <Phone className="w-4 h-4 text-emerald-500" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Digital Business Card"
                >
                  <QrCode className="w-4 h-4 text-blue-500" />
                </button>
              </div>

            </div>

            {/* 4 Golden Pillars of Performance Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Sales Closed
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {totalSales}+ Deals
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  Verified Volume
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Rentals Transacted
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {totalRentals}+ Units
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                  Long-Term & Villas
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Active Exclusive Listings
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {listings.length} Properties
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                  Available Now
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Client Satisfaction
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{averageRating}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                  Based on {reviews.length} reviews
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Main Grid: Details, Video & Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Bio, Video Tour, Service Areas (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bio & Professional Background */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span>Professional Biography & Accreditation</span>
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowStudioModal(true)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Bio
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.bio || `Certified Real Estate Specialist representing ${agencyName}. Dedicated to providing institutional-grade property acquisition, title due diligence, and high-yield investment advisory across Sri Lanka's prime residential and commercial corridors.`}
              </p>

              {/* Service Areas & Languages Badges */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Covered Service Districts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {serviceAreas.map((area, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {typeof area === 'string' ? area.trim() : area}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> Languages Spoken
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                        {typeof lang === 'string' ? lang.trim() : lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Showcase Player */}
            {embedUrl && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-500" />
                  <span>Agent HD Video Tour & Agency Reel</span>
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-black">
                  <iframe
                    src={embedUrl}
                    title="Agent Introduction Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Verified Client Reviews & Ratings Section */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-current" />
                    <span>Verified Client Reviews ({reviews.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">Authentic feedback from verified property buyers and sellers</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Star className="w-3.5 h-3.5 fill-current" /> Write a Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Star className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No client reviews yet</p>
                    <p className="text-xs text-slate-400 mt-1">Be the first client to review {agentData.name}</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                            {rev.reviewer?.name?.[0] || 'C'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {rev.reviewer?.name || 'Verified Client'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-LK') : 'Verified Buyer'}
                            </span>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Exclusive Inventory Showcase (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <span>Exclusive Listings ({listings.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">Properties represented by {agentData.name}</p>
                </div>
              </div>

              {/* Property Cards Stack */}
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active listings</p>
                    <p className="text-xs text-slate-400">New exclusive inventory coming soon.</p>
                  </div>
                ) : (
                  listings.map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => navigate(`/property/${prop.id}`)}
                      className="group p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 transition-all hover:shadow-md cursor-pointer flex gap-4"
                    >
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
                        <img
                          src={prop.images?.[0] || 'https://via.placeholder.com/300x200?text=Listing'}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white block truncate">
                            Rs. {Number(prop.price || 0).toLocaleString()}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                            {prop.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>{prop.city || prop.district || 'Prime Area'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          {prop.bedrooms && <span>{prop.bedrooms} Beds</span>}
                          {prop.bathrooms && <span>• {prop.bathrooms} Baths</span>}
                          <span className="ml-auto text-blue-600 dark:text-blue-400 flex items-center gap-0.5 text-[10px] uppercase tracking-wider font-black">
                            View <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Consultation Booking Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-300" />
              </div>
              <h4 className="text-base font-black tracking-tight">
                Looking for Bespoke Property Acquisition?
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Connect directly with {agentData.name} for exclusive off-market listings, title verification, and tailored property investment advisory.
              </p>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Schedule Private Consultation
              </button>
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AgentProfile;

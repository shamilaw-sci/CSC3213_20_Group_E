import React, { useState, useRef } from 'react';
import api from '../../../context/api';
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
    cover_position_x: profile?.cover_position_x ?? 50,
    cover_position_y: profile?.cover_position_y ?? 50,
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
        setFormData(prev => ({ ...prev, cover_image_url: reader.result, cover_position_x: 50, cover_position_y: 50 }));
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
                              <img src={formData.cover_image_url} alt="Cover Banner Preview" className="w-full h-full object-cover" style={{ objectPosition: `${formData.cover_position_x}% ${formData.cover_position_y}%` }} />
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
                                onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '', cover_position_x: 50, cover_position_y: 50 }))}
                                className="text-[11px] text-slate-500 hover:underline font-semibold"
                              >
                                Use Gradient
                              </button>
                            )}
                          </div>
                          {formData.cover_image_url && (
                            <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                              <label className="block" htmlFor="cover-position-x">Horizontal cover position ({formData.cover_position_x}%)</label>
                              <input id="cover-position-x" type="range" min="0" max="100" step="1" value={formData.cover_position_x} onChange={e => setFormData(prev => ({ ...prev, cover_position_x: Number(e.target.value) }))} className="w-full accent-blue-600" />
                              <label className="block" htmlFor="cover-position-y">Vertical cover position ({formData.cover_position_y}%)</label>
                              <input id="cover-position-y" type="range" min="0" max="100" step="1" value={formData.cover_position_y} onChange={e => setFormData(prev => ({ ...prev, cover_position_y: Number(e.target.value) }))} className="w-full accent-blue-600" />
                              <button type="button" onClick={() => setFormData(prev => ({ ...prev, cover_position_x: 50, cover_position_y: 50 }))} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Reset cover position</button>
                            </div>
                          )}
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
                            onClick={() => setFormData(prev => ({ ...prev, cover_image_url: preset.url, cover_position_x: 50, cover_position_y: 50 }))}
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

export default AgentCustomizationStudioModal;

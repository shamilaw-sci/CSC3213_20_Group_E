import React, { useState, useEffect, useRef, useCallback } from 'react';
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

import AgentCustomizationStudioModal from './agent/components/AgentCustomizationStudioModal';
import BookViewingModal from './agent/components/BookViewingModal';
import DigitalAgentCardModal from './agent/components/DigitalAgentCardModal';
import WriteReviewModal from './agent/components/WriteReviewModal';

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

  const fetchAgent = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

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

                {!isOwner && (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct Chat</span>
                  </button>
                )}

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

                {/* Only buyers and sellers can write a review - not the agent themselves or other agents/admins */}
                {user && !isOwner && (user.role === 'BUYER' || user.role === 'SELLER') && (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" /> Write a Review
                  </button>
                )}
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

            {/* Quick Consultation Booking Banner (Clients Only) */}
            {!isOwner && (
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
            )}

          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AgentProfile;

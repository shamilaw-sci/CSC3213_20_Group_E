import React, { useState } from 'react';
import api from '../../../context/api';
import { useAuth } from '../../../context/UserAuthContext';
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


const BookViewingModal = ({ agent, listings, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => ({
    client_name: user?.name || '',
    client_email: user?.email || '',
    client_phone: user?.phone || '',
    property_id: listings?.[0]?.id || '',
    viewing_type: 'In-Person Property Tour',
    preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferred_time: 'Morning (9:00 AM - 12:00 PM)',
    notes: ''
  }));
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

export default BookViewingModal;

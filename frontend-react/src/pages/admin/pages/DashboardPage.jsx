import { logClientError } from '../../../utils/clientLog';
import React, { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth, fetchListings } from "../api/adminApi";
import { useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { 
  Building2, 
  Clock, 
  Users, 
  DollarSign, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2, 
  TrendingUp, 
  MapPin, 
  PieChart, 
  ArrowRight,
  AlertCircle
} from "lucide-react";

// Modern Interactive Bar Chart with tooltips and glowing columns
const BarChart = ({ data = [], colorClass = "from-blue-600 to-indigo-500", suffix = "" }) => {
  if (!data || !data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-500 font-bold">
        No transaction records in this interval.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => Number(d.value ?? d.users ?? d.count ?? 0)), 1);

  return (
    <div className="flex items-end justify-between h-48 mt-4 gap-2.5 sm:gap-4 px-2">
      {data.map((d, i) => {
        const val = Number(d.value ?? d.users ?? d.count ?? 0);
        const heightPct = Math.max((val / max) * 100, 10);

        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative">
            {/* Hover Tooltip */}
            <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-[11px] font-black py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none -translate-y-1 group-hover:translate-y-0 border border-slate-700">
              {suffix === "LKR" ? `LKR ${val.toLocaleString()}` : `${val.toLocaleString()} ${suffix}`}
            </div>

            {/* Bar Track Container */}
            <div className="w-full relative flex items-end justify-center h-36 rounded-2xl bg-slate-800/60 p-1 overflow-hidden border border-slate-700/50">
              <m.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                className={`w-full bg-gradient-to-t ${colorClass} rounded-xl shadow-md opacity-90 group-hover:opacity-100 transition-opacity min-h-[8px]`}
              />
            </div>

            {/* Month / Period Label */}
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2.5 uppercase tracking-wider">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingApproval: 0,
    activeListings: 0,
    totalUsers: 0,
    buyerCount: 0,
    sellerCount: 0,
    revenue: 0,
    rejectedListings: 0,
    listingTypes: []
  });
  const [revenue, setRevenue] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedSections, setFailedSections] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          fetchDashboardStats(),
          fetchRevenueData("monthly"),
          fetchUserGrowth(),
          fetchListings({ status: "pending" }),
        ]);
        const names = ['statistics', 'revenue', 'user growth', 'pending listings'];
        setFailedSections(results.flatMap((result, index) => result.status === 'rejected' ? [names[index]] : []));
        const [s, r, u, pending] = results.map(result => result.status === 'fulfilled' ? result.value : null);
        if (s) setStats(s);
        if (r?.data) setRevenue(r.data);
        if (u?.data) setUserGrowth(u.data);
        if (pending?.listings) {
          setPendingListings(
            pending.listings.slice(0, 5).map((listing) => ({
              id: listing.id,
              title: listing.title,
              seller: listing.seller_id || "Seller unavailable",
              city: listing.city || listing.district || "Location unavailable",
              date: listing.created_at?.slice(0, 10) || "-",
              price: `LKR ${Number(listing.price || 0).toLocaleString("en-LK")}`,
            }))
          );
        }
      } catch (err) {
        logClientError('admin_dashboard_load_failed');
        setFailedSections(['statistics', 'revenue', 'user growth', 'pending listings']);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-LK").format(n || 0);
  const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n || 0)}`;

  const statCards = [
    { 
      title: "Total Portfolio Listings", 
      value: fmt(stats.totalListings || 0), 
      icon: Building2, 
      desc: `${stats.activeListings || 0} Live · ${stats.pendingApproval || 0} In Review`, 
      color: "from-blue-600 to-cyan-500",
      textColor: "text-blue-400",
      bgLight: "bg-blue-950/60 border border-blue-800/60",
      route: "/admin/listings"
    },
    { 
      title: "Pending Title Verifications", 
      value: fmt(stats.pendingApproval || 0), 
      icon: Clock, 
      desc: "Requires Super Admin Action", 
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-400",
      bgLight: "bg-amber-950/60 border border-amber-800/60",
      route: "/admin/listings?status=pending"
    },
    { 
      title: "Registered Platform Users", 
      value: fmt(stats.totalUsers || 0), 
      icon: Users, 
      desc: `${stats.buyerCount || 0} Buyers · ${stats.sellerCount || 0} Sellers`, 
      color: "from-indigo-600 to-purple-600",
      textColor: "text-indigo-400",
      bgLight: "bg-indigo-950/60 border border-indigo-800/60",
      route: "/admin/users"
    },
    { 
      title: "Total Platform Revenue", 
      value: fmtCur(stats.revenue || 0), 
      icon: DollarSign, 
      desc: "Recorded successful listing payments", 
      color: "from-emerald-600 to-teal-500",
      textColor: "text-emerald-400",
      bgLight: "bg-emerald-950/60 border border-emerald-800/60",
      route: "/admin/reports"
    }
  ];

  if (loading) return <p role="status" className="text-slate-300 p-6">Loading dashboard…</p>;
  if (failedSections.includes('statistics')) return <p role="alert" className="text-amber-300 p-6">Dashboard statistics are unavailable. Reload to try again.</p>;

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-100">
      {failedSections.length > 0 && <p role="alert" className="text-amber-300">Unable to load {failedSections.join(', ')}. Reload to try again.</p>}
      
      {/* 1. High-Contrast Official Amber Moderation Banner */}
      {stats.pendingApproval > 0 && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/50 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0 font-black">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] font-black uppercase tracking-wider border border-amber-500/40">
                  ACTION REQUIRED
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-200">
                  {stats.pendingApproval} Properties Awaiting Super Admin Deed Verification
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-1">
                New deed submissions and PostGIS spatial boundaries require legal review before publishing to the live map.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/listings?status=pending")}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-xl shadow-amber-500/25 shrink-0 cursor-pointer"
          >
            <span>Review & Approve</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </m.div>
      )}

      {/* 2. Top Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <m.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => navigate(stat.route)}
              className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                    {stat.title}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white mt-1.5 block tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bgLight} ${stat.textColor} group-hover:scale-110 transition duration-300 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-400">
                  {stat.desc}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
              </div>
            </m.div>
          );
        })}
      </div>

      {/* 3. Deep Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Overview Card */}
        <m.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Monthly Revenue Inflow</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  LKR
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Recorded successful listing payments
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Audit Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {failedSections.includes('revenue') ? <p>Revenue data is unavailable.</p> : <BarChart data={revenue} colorClass="from-blue-600 to-cyan-500" suffix="LKR" />}
        </m.div>

        {/* User Growth Card */}
        <m.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }} 
          className="bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Platform User Growth</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Cumulative
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Cumulative registered platform accounts
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Deep Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {failedSections.includes('user growth') ? <p>User growth data is unavailable.</p> : <BarChart data={userGrowth} colorClass="from-purple-600 to-indigo-500" suffix="accounts" />}
        </m.div>

      </div>

      {/* 4. Platform Insights & Moderation Queue Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Platform Insights & Health */}
        <m.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-lg xl:col-span-1"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">Platform Health & Inventory</h3>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Loaded on page open
            </span>
          </div>

          <div className="space-y-3 mt-5">
            {[
              { label: "Active & Live Properties", value: fmt(stats.activeListings), color: "text-emerald-300", bg: "bg-emerald-500/15 border border-emerald-500/30" },
              { label: "Pending Legal Review", value: fmt(stats.pendingApproval), color: "text-amber-300", bg: "bg-amber-500/15 border border-amber-500/30" },
              { label: "Rejected / Defective Deeds", value: fmt(stats.rejectedListings), color: "text-red-300", bg: "bg-red-500/15 border border-red-500/30" },
              { label: "Registered Buyers", value: fmt(stats.buyerCount), color: "text-blue-300", bg: "bg-blue-500/15 border border-blue-500/30" },
              { label: "Registered Sellers", value: fmt(stats.sellerCount), color: "text-purple-300", bg: "bg-purple-500/15 border border-purple-500/30" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/80 transition-colors">
                <span className="text-xs font-bold text-slate-300">{label}</span>
                <span className={`text-xs font-black px-3 py-1 rounded-xl ${bg} ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Quick Legal Safety Note */}
          <div className="mt-5 p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed font-light">
              <span className="font-bold text-white block mb-0.5">Location review:</span>
              Review submitted coordinates, boundaries and supporting documents before approving a listing.
            </div>
          </div>
        </m.div>

        {/* Pending Moderation Queue Table */}
        <m.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }} 
          className="bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-lg xl:col-span-2 flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white">Pending Moderation Queue</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Properties awaiting Super Admin deed & polygon approval
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/listings?status=pending")}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <span>Full Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Property Title</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Price (LKR)</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {failedSections.includes('pending listings') && <tr><td colSpan={5} className="py-10 text-center">Pending listings are unavailable.</td></tr>}
                {!failedSections.includes('pending listings') && pendingListings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-2" />
                        <span className="text-white font-bold text-sm">All Clear!</span>
                        <span className="text-slate-400 text-xs mt-0.5">No pending listings waiting for verification.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {pendingListings.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 pr-3">
                      <div className="text-xs font-bold text-white line-clamp-1 max-w-[220px]">{p.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">REF: {p.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3.5 pr-3 text-xs font-semibold text-slate-300">{p.city}</td>
                    <td className="py-3.5 pr-3">
                      <span className="text-xs font-black text-emerald-400">{p.price}</span>
                    </td>
                    <td className="py-3.5 pr-3 text-xs font-semibold text-slate-400">{p.date}</td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/listings`)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition font-bold text-xs shadow-md cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </m.div>

      </div>

    </div>
  );
};

export default DashboardPage;

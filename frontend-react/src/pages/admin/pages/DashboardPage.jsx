import React, { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth, fetchListings } from "../api/adminApi";
import { m } from "framer-motion";
import { Home, Clock, Users, DollarSign, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

// Simple bar chart using Tailwind utilities
const BarChart = ({ data = [], colorClass = "bg-blue-500" }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="flex items-end justify-between h-48 mt-4 gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 group">
          <div className="w-full relative flex items-end justify-center h-full rounded-t-lg bg-gray-50 overflow-hidden">
            <m.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: d.value / max }}
              style={{ transformOrigin: "bottom" }}
              transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
              className={`w-full h-full ${colorClass} rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity min-h-[4px]`}
            />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-10 pointer-events-none">
                {d.value.toLocaleString()}
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// Removed mock data

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingApproval: 0,
    activeListings: 0,
    totalUsers: 0,
    buyerCount: 0,
    sellerCount: 0,
    revenue: 0,
    rejectedListings: 0,
  });
  const [revenue, setRevenue] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, u, pending] = await Promise.all([
          fetchDashboardStats(),
          fetchRevenueData("monthly"),
          fetchUserGrowth(),
          fetchListings({ status: "pending" }),
        ]);
        if (s) setStats(s);
        if (r?.data) setRevenue(r.data);
        if (u?.data) setUserGrowth(u.data);
        if (pending?.listings) {
          setPendingListings(
            pending.listings.slice(0, 5).map((listing) => ({
              id: listing.id,
              title: listing.title,
              seller: listing.seller_id || "Seller",
              date: listing.created_at?.slice(0, 10) || "-",
              price: `LKR ${Number(listing.price || 0).toLocaleString("en-LK")}`,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };
    load();
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-LK").format(n);
  const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n)}`;

  const statCards = [
    { title: "Total Listings", value: fmt(stats.totalListings || 0), icon: Home, trend: "up", desc: "Active & Pending", color: "blue" },
    { title: "Pending Approval", value: fmt(stats.pendingApproval || 0), icon: Clock, trend: "neutral", desc: "Requires action", color: "orange" },
    { title: "Total Users", value: fmt(stats.totalUsers || 0), icon: Users, trend: "up", desc: "Buyers & Sellers", color: "indigo" },
    { title: "Total Revenue", value: fmtCur(stats.revenue || 0), icon: DollarSign, trend: "up", desc: "Overall Income", color: "emerald" }
  ];

  const getColorClasses = (color) => {
      const map = {
          blue: "bg-blue-50 text-blue-600 border-blue-100",
          orange: "bg-orange-50 text-orange-600 border-orange-100",
          indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
          emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
      };
      return map[color] || map.blue;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <m.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${stat.color}-500/5 to-${stat.color}-500/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{stat.title}</span>
                    <span className={`text-3xl font-black text-gray-900 mt-2 ${stat.title === 'Monthly Revenue' ? 'text-2xl' : ''}`}>{stat.value}</span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${getColorClasses(stat.color)}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-4 relative z-10">
                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : 
                 stat.trend === 'down' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : null}
                <span className={`text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                    {stat.desc}
                </span>
            </div>
          </m.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="admin-card">
          <div className="admin-card-header">
            <div>
                <h3 className="admin-card-title">Revenue Overview</h3>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Listing fees (LKR)</p>
            </div>
          </div>
          <BarChart data={revenue} colorClass="bg-gradient-to-t from-blue-600 to-blue-400" />
        </m.div>

        <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="admin-card">
          <div className="admin-card-header">
            <div>
                <h3 className="admin-card-title">User Growth</h3>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Registered Accounts</p>
            </div>
          </div>
          <BarChart data={userGrowth} colorClass="bg-gradient-to-t from-indigo-600 to-indigo-400" />
        </m.div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Overview List */}
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="admin-card xl:col-span-1">
          <div className="admin-card-header border-b border-gray-100 pb-4">
            <h3 className="admin-card-title">Platform Summary</h3>
          </div>
          <div className="space-y-4 mt-6">
            {[
              { label: "Active Listings", value: fmt(stats.activeListings), color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Pending Approval", value: fmt(stats.pendingApproval), color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Rejected / Removed", value: fmt(stats.rejectedListings), color: "text-red-600", bg: "bg-red-50" },
              { label: "Buyers Registered", value: fmt(stats.buyerCount), color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Sellers Registered", value: fmt(stats.sellerCount), color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">{label}</span>
                <span className={`text-sm font-black px-3 py-1 rounded-lg ${bg} ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </m.div>

        {/* Pending Listings Table */}
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="admin-card xl:col-span-2 flex flex-col">
          <div className="admin-card-header border-b border-gray-100 pb-4">
            <h3 className="admin-card-title">Pending Approvals</h3>
            <a aria-label="Accessible interactive control" href="/admin/listings" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                View All <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex-1 mt-4">
            <div className="admin-data-table-wrap border-none">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th className="bg-transparent text-[10px]">Reference</th>
                    <th className="bg-transparent text-[10px]">Property</th>
                    <th className="bg-transparent text-[10px]">Price</th>
                    <th className="bg-transparent text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingListings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center">
                            <Clock className="w-8 h-8 text-gray-300 mb-2" />
                            <span className="text-gray-500 font-medium">No properties waiting for approval.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {pendingListings.map((p) => (
                    <tr key={p.id}>
                      <td><span className="text-xs font-bold font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">{p.id}</span></td>
                      <td>
                        <div className="text-sm font-bold text-gray-900">{p.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.seller}</div>
                      </td>
                      <td><span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{p.price}</span></td>
                      <td className="text-xs font-bold text-gray-400">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </m.div>
      </div>

    </div>
  );
};

export default DashboardPage;

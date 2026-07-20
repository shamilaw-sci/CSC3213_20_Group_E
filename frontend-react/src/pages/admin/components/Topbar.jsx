import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchDashboardStats, fetchListings, fetchUsers } from "../api/adminApi";
import {
  Bell, Search, X, Clock, CheckCircle, AlertCircle, ChevronRight,
  Home, Users, BarChart2, MessageSquare, FileText, Settings, ShieldCheck, Layout,
} from "lucide-react";

// ─── Static page shortcuts shown in search ───────────────────────────────────
const ADMIN_PAGES = [
  { label: "Dashboard",   subtitle: "Overview & stats",              path: "/admin/dashboard",   icon: Layout },
  { label: "Listings",    subtitle: "Manage property listings",      path: "/admin/listings",    icon: Home },
  { label: "Users",       subtitle: "Buyers & sellers",             path: "/admin/users",       icon: Users },
  { label: "Analytics",   subtitle: "Search trends & heatmaps",     path: "/admin/analytics",   icon: BarChart2 },
  { label: "Messages",    subtitle: "Support conversations",         path: "/admin/messages",    icon: MessageSquare },
  { label: "Reports",     subtitle: "Financial & transactions",      path: "/admin/reports",     icon: FileText },
  { label: "Audit Logs",  subtitle: "System-wide action trail",     path: "/admin/audit-logs",  icon: ShieldCheck },
  { label: "Settings",    subtitle: "Platform configuration",        path: "/admin/settings",    icon: Settings },
];

const PAGE_TITLES = {
  "/admin/dashboard":  { title: "Dashboard",  subtitle: "Welcome back, here's what's happening" },
  "/admin/listings":   { title: "Listings",   subtitle: "Manage and moderate property listings" },
  "/admin/users":      { title: "Users",      subtitle: "Manage registered buyers and sellers" },
  "/admin/analytics":  { title: "Analytics",  subtitle: "Search trends, heatmaps & engagement" },
  "/admin/messages":   { title: "Messages",   subtitle: "Reply to buyer, seller, and support chats" },
  "/admin/reports":    { title: "Reports",    subtitle: "Financial & transaction history" },
  "/admin/audit-logs": { title: "Audit Logs", subtitle: "System-wide action trail" },
  "/admin/settings":   { title: "Settings",   subtitle: "Platform configuration & parameters" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const highlight = (text = "", query = "") => {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-100 text-blue-700 rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const Topbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // ── Notification state ──
  const [pendingCount, setPendingCount]     = useState(0);
  const [pendingListings, setPendingListings] = useState([]);
  const [loadingNotifs, setLoadingNotifs]   = useState(false);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [panelOpen, setPanelOpen]           = useState(false);
  const bellRef      = useRef(null);
  const dropdownRef  = useRef(null);
  const panelRef     = useRef(null);
  const hoverTimerRef = useRef(null);

  // ── Search state ──
  const [query, setQuery]             = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults]         = useState({ pages: [], listings: [], users: [] });
  const [activeIdx, setActiveIdx]     = useState(-1);
  const searchRef    = useRef(null);
  const inputRef     = useRef(null);
  const debounceRef  = useRef(null);

  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Admin Panel", subtitle: "" };

  const now = new Date().toLocaleDateString("en-LK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ─── Notification logic ───────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const [stats, pending] = await Promise.all([
        fetchDashboardStats(),
        fetchListings({ status: "pending" }),
      ]);
      setPendingCount(stats?.pendingApproval || 0);
      if (pending?.listings) {
        setPendingListings(
          pending.listings.slice(0, 8).map((l) => ({
            id: l.id,
            title: l.title || "Untitled Property",
            seller: l.seller_id || "Unknown Seller",
            date: l.created_at?.slice(0, 10) || "-",
            price: `LKR ${Number(l.price || 0).toLocaleString("en-LK")}`,
            location: l.location || l.district || "",
          }))
        );
      }
    } catch { setPendingCount(0); }
    finally { setLoadingNotifs(false); }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Close notification panel on outside click
  useEffect(() => {
    const handle = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) { setPanelOpen(false); setDropdownOpen(false); }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handle = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Global Escape closes everything
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") {
        setPanelOpen(false); setDropdownOpen(false);
        setSearchOpen(false); setQuery(""); setActiveIdx(-1);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  // ─── Search logic ─────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults({ pages: [], listings: [], users: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      // Pages (local filter)
      const pages = ADMIN_PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(term) ||
          p.subtitle.toLowerCase().includes(term)
      );

      // Listings (API)
      let listings = [];
      try {
        const res = await fetchListings({ search: q, limit: 5 });
        listings = (res?.listings || []).slice(0, 5).map((l) => ({
          id: l.id || l._id,
          title: l.title || "Untitled",
          location: l.location || l.address || "",
          status: l.status || "pending",
          price: `LKR ${Number(l.price || 0).toLocaleString("en-LK")}`,
        }));
      } catch { /* API may not support search param — silent fail */ }

      // Users (API)
      let users = [];
      try {
        const res = await fetchUsers({ search: q, limit: 5 });
        users = (res?.users || []).slice(0, 5).map((u) => ({
          id: u.id || u._id,
          name: u.name || u.full_name || "Unknown",
          email: u.email || "",
          role: u.role || "buyer",
        }));
      } catch { /* silent */ }

      setResults({ pages, listings, users });
    } finally {
      setSearchLoading(false);
      setActiveIdx(-1);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchOpen(true);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults({ pages: [], listings: [], users: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  // Flatten all results for keyboard nav
  const flatResults = [
    ...results.pages.map((r) => ({ ...r, _type: "page" })),
    ...results.listings.map((r) => ({ ...r, _type: "listing" })),
    ...results.users.map((r) => ({ ...r, _type: "user" })),
  ];

  const handleKeyDown = (e) => {
    if (!searchOpen || flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && flatResults[activeIdx]) {
        handleResultClick(flatResults[activeIdx]);
      }
    }
  };

  const handleResultClick = (item) => {
    setSearchOpen(false);
    setQuery("");
    setActiveIdx(-1);
    if (item._type === "page")    navigate(item.path);
    if (item._type === "listing") navigate(`/admin/listings?highlight=${item.id}`);
    if (item._type === "user")    navigate(`/admin/users?highlight=${item.id}`);
  };

  const handleSearchFocus = () => {
    setSearchOpen(true);
    if (query.trim()) doSearch(query);
  };

  // ─── Notification handlers ────────────────────────────────────────────────
  const handleBellMouseEnter = () => {
    if (panelOpen) return;
    hoverTimerRef.current = setTimeout(() => setDropdownOpen(true), 150);
  };
  const handleBellMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setDropdownOpen(false), 300);
  };
  const handleDropdownMouseEnter = () => clearTimeout(hoverTimerRef.current);
  const handleDropdownMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };
  const handleBellClick = () => { setDropdownOpen(false); setPanelOpen((p) => !p); };
  const handleViewAll = () => { setPanelOpen(false); setDropdownOpen(false); navigate("/admin/listings?status=pending"); };
  const handleNotifClick = (id) => { setPanelOpen(false); navigate(`/admin/listings?highlight=${id}`); };

  const hasResults = flatResults.length > 0;
  const showDropdown = searchOpen && query.trim().length > 0;

  // running index for keyboard highlight
  let flatIdx = 0;

  return (
    <>
      <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">

        {/* Left: Title */}
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs font-bold text-gray-500">{subtitle}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">

          {/* ── Global Search ── */}
          <div ref={searchRef} className="relative hidden md:block">
            <div
              className={`flex items-center gap-2 bg-gray-50 border rounded-full px-4 py-2 transition-all duration-200 ${
                searchOpen
                  ? "border-blue-400 ring-2 ring-blue-100 bg-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {searchLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                id="admin-global-search"
                aria-label="Search admin panel"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                type="text"
                placeholder="Search listings, users, pages…"
                value={query}
                onChange={handleQueryChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-56"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults({ pages: [], listings: [], users: [] }); inputRef.current?.focus(); }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ── Search Results Dropdown ── */}
            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                style={{ animation: "notifDropIn 0.15s cubic-bezier(0.4,0,0.2,1)" }}
                role="listbox"
              >
                {/* No results */}
                {!searchLoading && !hasResults && (
                  <div className="flex flex-col items-center py-10 text-gray-400">
                    <Search className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-bold text-gray-500">No results for "<span className="text-blue-600">{query}</span>"</p>
                    <p className="text-xs mt-1">Try a listing title, user name, or page name</p>
                  </div>
                )}

                {/* Loading skeleton */}
                {searchLoading && (
                  <div className="px-4 py-4 space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-100 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!searchLoading && hasResults && (
                  <div className="max-h-[420px] overflow-y-auto">

                    {/* Pages */}
                    {results.pages.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pages</span>
                        </div>
                        {results.pages.map((item) => {
                          const isActive = flatIdx === activeIdx;
                          const idx = flatIdx++;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleResultClick({ ...item, _type: "page" })}
                              onMouseEnter={() => setActiveIdx(idx)}
                              role="option"
                              aria-selected={isActive}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                isActive ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                                  {highlight(item.label, query)}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-gray-300"}`} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Listings */}
                    {results.listings.length > 0 && (
                      <div>
                        <div className={`px-4 pb-1.5 ${results.pages.length ? "pt-2 border-t border-gray-50" : "pt-3"}`}>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listings</span>
                        </div>
                        {results.listings.map((item) => {
                          const isActive = flatIdx === activeIdx;
                          const idx = flatIdx++;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleResultClick({ ...item, _type: "listing" })}
                              onMouseEnter={() => setActiveIdx(idx)}
                              role="option"
                              aria-selected={isActive}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                isActive ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-blue-600 text-white" : "bg-orange-50 text-orange-500"}`}>
                                <Home className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                                  {highlight(item.title, query)}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {item.price}{item.location ? ` · ${item.location}` : ""}
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                item.status?.toLowerCase().includes("pend")
                                  ? "bg-orange-100 text-orange-600"
                                  : item.status?.toLowerCase().includes("approv")
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-500"
                              }`}>
                                {item.status}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          onClick={() => { setSearchOpen(false); setQuery(""); navigate(`/admin/listings?search=${encodeURIComponent(query)}`); }}
                          className="w-full flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-50 cursor-pointer"
                        >
                          See all listing results <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Users */}
                    {results.users.length > 0 && (
                      <div>
                        <div className={`px-4 pb-1.5 ${(results.pages.length || results.listings.length) ? "pt-2 border-t border-gray-50" : "pt-3"}`}>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Users</span>
                        </div>
                        {results.users.map((item) => {
                          const isActive = flatIdx === activeIdx;
                          const idx = flatIdx++;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleResultClick({ ...item, _type: "user" })}
                              onMouseEnter={() => setActiveIdx(idx)}
                              role="option"
                              aria-selected={isActive}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                isActive ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-blue-600 text-white" : "bg-indigo-50 text-indigo-500"}`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                                  {highlight(item.name, query)}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{highlight(item.email, query)}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0 capitalize">
                                {item.role}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          onClick={() => { setSearchOpen(false); setQuery(""); navigate(`/admin/users?search=${encodeURIComponent(query)}`); }}
                          className="w-full flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-50 cursor-pointer"
                        >
                          See all user results <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Keyboard hint */}
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400 font-medium bg-gray-50">
                      <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-gray-500">↑↓</kbd> navigate</span>
                      <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-gray-500">Enter</kbd> select</span>
                      <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-gray-500">Esc</kbd> close</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Date & System Status */}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900">{now}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          {/* Notification Bell */}
          <div
            ref={bellRef}
            className="relative"
            onMouseEnter={handleBellMouseEnter}
            onMouseLeave={handleBellMouseLeave}
          >
            <button
              id="admin-notif-bell"
              aria-label={`Notifications${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`}
              aria-haspopup="true"
              aria-expanded={panelOpen}
              onClick={handleBellClick}
              className={`p-2.5 rounded-full transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer ${
                panelOpen
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <Bell className={`w-5 h-5 transition-transform duration-200 ${panelOpen ? "rotate-12" : ""}`} />
            </button>

            {/* Badge */}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md border-2 border-white px-1 pointer-events-none">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}

            {/* Hover Dropdown */}
            {dropdownOpen && !panelOpen && (
              <div
                ref={dropdownRef}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
                className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                style={{ animation: "notifDropIn 0.18s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">Notifications</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
                  )}
                </div>
                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                  {pendingListings.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-gray-400">
                      <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                      <span className="text-xs font-bold">All caught up!</span>
                    </div>
                  ) : (
                    pendingListings.slice(0, 4).map((n) => (
                      <button key={n.id} onClick={() => handleNotifClick(n.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50/60 transition-colors text-left cursor-pointer">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{n.price} · {n.date}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <button onClick={handleViewAll}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors py-1 cursor-pointer">
                    Open Notification Panel <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Notification Panel Backdrop ── */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          onClick={() => setPanelOpen(false)}
          style={{ animation: "notifFadeIn 0.2s ease" }}
        />
      )}

      {/* ── Notification Side Panel ── */}
      <aside
        ref={panelRef}
        aria-label="Notification Panel"
        className="fixed top-0 right-0 h-full w-96 bg-white z-50 shadow-2xl flex flex-col border-l border-gray-100 transition-transform duration-300"
        style={{ transform: panelOpen ? "translateX(0)" : "translateX(110%)" }}
      >
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="text-base font-black text-white tracking-tight">Notifications</h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5 font-medium">
              {pendingCount > 0 ? `${pendingCount} listings awaiting approval` : "No pending approvals"}
            </p>
          </div>
          <button onClick={() => setPanelOpen(false)}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Pending Approvals</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingNotifs ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
              <span className="text-xs font-bold">Loading notifications…</span>
            </div>
          ) : pendingListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
              <h4 className="text-sm font-black text-gray-700">All caught up!</h4>
              <p className="text-xs text-gray-400 mt-1">No listings pending approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingListings.map((n, i) => (
                <button key={n.id} onClick={() => handleNotifClick(n.id)}
                  className="w-full flex items-start gap-4 px-6 py-4 hover:bg-blue-50/50 transition-all duration-150 text-left group cursor-pointer"
                  style={{ animationDelay: `${i * 0.05}s`, animation: panelOpen ? "notifSlideIn 0.25s ease forwards" : "none" }}>
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                    {n.location && <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{n.location}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{n.price}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{n.date}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors shadow-md shadow-blue-200 cursor-pointer">
            View All Pending Listings <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={loadNotifications}
            className="w-full mt-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 cursor-pointer">
            ↻ Refresh notifications
          </button>
        </div>
      </aside>

      {/* Keyframes */}
      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes notifFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        mark { font-style: normal; }
      `}</style>
    </>
  );
};

export default Topbar;

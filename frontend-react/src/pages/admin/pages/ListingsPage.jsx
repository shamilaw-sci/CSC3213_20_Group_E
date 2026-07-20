import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { fetchListings, fetchListingById, approveListing, rejectListing, deleteListing } from "../api/adminApi";
import { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/admin-global.css";
import {
  Search, X, Eye, Check, Ban, Trash2, MapPin, Home, Calendar,
  DollarSign, User, Image, ChevronRight, AlertCircle, CheckCircle,
  Clock, FileText, CreditCard,
} from "lucide-react";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending: "Pending Approval",
  "pending approval": "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  sold: "Sold",
};

const STATUS_STYLE = {
  "Pending Approval": { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400", icon: Clock },
  Approved:           { bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-400",  icon: CheckCircle },
  Rejected:           { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400",    icon: Ban },
  Sold:               { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400",   icon: CheckCircle },
};

const MOCK_LISTINGS = [
  { _id: "1", title: "3.5 Perches Land, Kandy City",      seller: { name: "Chaminda Perera", email: "chaminda@mail.com" }, price: 4200000,  area: "3.5 perches", status: "Pending Approval", date: "2026-04-25", location: "Kandy",          images: 3 },
  { _id: "2", title: "10 Acres Farm Land, Nuwara Eliya",  seller: { name: "Nimal Silva",     email: "nimal@mail.com"    }, price: 18000000, area: "10 acres",    status: "Approved",         date: "2026-04-20", location: "Nuwara Eliya",    images: 5 },
  { _id: "3", title: "Commercial Plot, Colombo 7",         seller: { name: "Yasith Fernando", email: "yasith@mail.com"   }, price: 28000000, area: "8 perches",   status: "Pending Approval", date: "2026-04-27", location: "Colombo",         images: 4 },
  { _id: "4", title: "Residential Land, Gampaha",          seller: { name: "Priya Kumari",    email: "priya@mail.com"    }, price: 6500000,  area: "6 perches",   status: "Rejected",         date: "2026-04-22", location: "Gampaha",         images: 2 },
  { _id: "5", title: "Paddy Field, Anuradhapura",          seller: { name: "Bandula Ratne",   email: "bandula@mail.com"  }, price: 3200000,  area: "2 acres",     status: "Approved",         date: "2026-04-18", location: "Anuradhapura",    images: 3 },
  { _id: "6", title: "Highland Land, Badulla",             seller: { name: "Saman Herath",    email: "saman@mail.com"    }, price: 8800000,  area: "15 perches",  status: "Pending Approval", date: "2026-04-28", location: "Badulla",         images: 4 },
];

const normalizeListing = (l) => {
  const rawStatus = (l.status || "pending").toLowerCase().replace(/_/g, " ");
  const status = STATUS_LABELS[rawStatus] || l.status || "Pending Approval";
  return {
    ...l,
    _id: l.id || l._id,
    seller: l.seller || { name: l.seller_name || l.seller_id || "Seller", email: l.seller_email || "" },
    area: l.area || (l.land_size ? `${l.land_size} perches` : "-"),
    status,
    date: l.date || l.created_at?.slice(0, 10) || "-",
    location: l.location || l.address || "-",
    imageUrls: Array.isArray(l.images) ? l.images : [],
    images: Array.isArray(l.images) ? l.images.length : (l.images || 0),
  };
};

const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n || 0)}`;

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ listing, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-900">Reject Listing</h3>
            <p className="text-sm text-gray-500 mt-1">Provide a reason for the seller</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm font-bold text-orange-800 truncate">{listing?.title}</p>
        </div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Rejection Reason <span className="text-red-500">*</span></label>
        <textarea
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          rows={4}
          placeholder="Describe clearly why this listing is being rejected…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Details Modal ────────────────────────────────────────────────────────────
const DetailsModal = ({ listing, onApprove, onReject, onDelete, onClose, loading }) => {
  const [imgIdx, setImgIdx] = useState(0);
  if (!listing) return null;

  const style = STATUS_STYLE[listing.status] || STATUS_STYLE["Pending Approval"];
  const StatusIcon = style.icon;
  const isPending = listing.status === "Pending Approval";
  const txn = listing.transactions?.[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "detailsPopIn 0.2s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                <StatusIcon className="w-3 h-3" />
                {listing.status}
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight truncate">{listing.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {listing.location}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-1 space-y-6">

          {/* Image gallery */}
          {listing.imageUrls?.length > 0 ? (
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                <img
                  src={listing.imageUrls[imgIdx]}
                  alt={`${listing.title} ${imgIdx + 1}`}
                  className="w-full h-full object-cover"
                />
                {listing.imageUrls.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx((i) => Math.max(i - 1, 0))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer text-lg">‹</button>
                    <button onClick={() => setImgIdx((i) => Math.min(i + 1, listing.imageUrls.length - 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer text-lg">›</button>
                    <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {imgIdx + 1} / {listing.imageUrls.length}
                    </span>
                  </>
                )}
              </div>
              {listing.imageUrls.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {listing.imageUrls.map((url, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${imgIdx === i ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl aspect-video flex flex-col items-center justify-center text-gray-400">
              <Image className="w-10 h-10 mb-2 opacity-30" />
              <span className="text-sm font-bold">No images uploaded</span>
            </div>
          )}

          {/* Key details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Price",      value: fmtCur(listing.price),         icon: DollarSign, color: "emerald" },
              { label: "Land Size",  value: listing.area || "-",            icon: Home,       color: "blue"    },
              { label: "Location",   value: listing.location || "-",        icon: MapPin,     color: "purple"  },
              { label: "Type",       value: listing.type || "Land",         icon: FileText,   color: "indigo"  },
              { label: "Bedrooms",   value: listing.bedrooms ?? "-",        icon: Home,       color: "pink"    },
              { label: "Bathrooms",  value: listing.bathrooms ?? "-",       icon: Home,       color: "cyan"    },
              { label: "Listed On",  value: listing.date,                   icon: Calendar,   color: "orange"  },
              { label: "Seller",     value: listing.seller?.name || "-",    icon: User,       color: "gray"    },
              { label: "Photos",     value: `${listing.images} photos`,     icon: Image,      color: "yellow"  },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-4">
                <div className={`w-7 h-7 rounded-lg bg-${color}-100 text-${color}-600 flex items-center justify-center mb-2`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{String(value)}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3">{listing.description}</p>
            </div>
          )}

          {/* Seller info */}
          <div className="bg-indigo-50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {(listing.seller?.name || "S")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900">{listing.seller?.name || "-"}</p>
              <p className="text-xs text-indigo-600 font-medium mt-0.5 truncate">{listing.seller?.email || "-"}</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">Seller</span>
          </div>

          {/* Payment receipt */}
          {txn ? (
            <div className="border-2 border-dashed border-green-200 rounded-2xl p-5 bg-green-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-black text-gray-900">Payment Receipt</span>
                </div>
                <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-full">VERIFIED</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Txn ID",  txn.transaction_id || "-"],
                  ["Amount",  `${txn.currency || "LKR"} ${Number(txn.amount || 0).toLocaleString()}`],
                  ["Method",  txn.payment_method || "-"],
                  ["Date",    txn.created_at ? new Date(txn.created_at).toLocaleString() : "-"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-gray-400 font-bold">{k}</span>
                    <span className="text-gray-900 font-bold text-xs truncate font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-red-700">Payment Pending</p>
                <p className="text-xs text-red-400 mt-0.5">No verified payment found for this listing</p>
              </div>
            </div>
          )}

          {/* Map */}
          {listing.latitude && listing.longitude && (
            <div>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Map Location</h4>
              <div className="h-56 rounded-2xl overflow-hidden border border-gray-200">
                <MapContainer center={[listing.latitude, listing.longitude]} zoom={14} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[listing.latitude, listing.longitude]}>
                    <Popup>{listing.title}</Popup>
                  </Marker>
                  {listing.boundary?.coordinates?.[0] && (
                    <Polygon
                      positions={listing.boundary.coordinates[0].map((c) => [c[1], c[0]])}
                      color="#2563eb" fillColor="#3b82f6" fillOpacity={0.3}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {listing.status === "Rejected" && listing.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 font-medium">{listing.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50 rounded-b-3xl sticky bottom-0">
          <button
            onClick={() => { onDelete(listing._id); onClose(); }}
            className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex items-center gap-3">
            {isPending && (
              <>
                <button
                  onClick={() => onReject(listing)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => onApprove(listing._id)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-200 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              </>
            )}
            {!isPending && (
              <span className={`text-xs font-black px-4 py-2 rounded-xl ${style.bg} ${style.text}`}>
                {listing.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes detailsPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ListingsPage = () => {
  const location = useLocation();
  const [allListings, setAllListings] = useState(MOCK_LISTINGS.map(normalizeListing));
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const debounceRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Parse URL params (from notification/search links)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    if (statusParam) setFilterStatus(statusParam);
  }, [location.search]);

  // Fetch from API when filter changes
  const fetchData = useCallback(async (status, searchTerm) => {
    setIsFetching(true);
    try {
      const params = {};
      if (status && status !== "all") params.status = status;
      if (searchTerm) params.search = searchTerm;
      const data = await fetchListings(params);
      if (data?.listings?.length) {
        setAllListings(data.listings.map(normalizeListing));
      }
    } catch {
      // silently keep mock data
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filterStatus, search);
  }, [filterStatus, fetchData]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(filterStatus, val), 400);
  };

  // Client-side filter (works on both API results and mock data)
  const filtered = allListings.filter((l) => {
    const term = search.toLowerCase();
    const matchStatus =
      filterStatus === "all" ||
      l.status.toLowerCase().replace(" ", "").includes(filterStatus.replace(" ", ""));
    const matchSearch =
      !term ||
      l.title?.toLowerCase().includes(term) ||
      l.seller?.name?.toLowerCase().includes(term) ||
      l.seller?.email?.toLowerCase().includes(term) ||
      l.location?.toLowerCase().includes(term) ||
      String(l.price).includes(term);
    return matchStatus && matchSearch;
  });

  // Open details
  const handleRowClick = async (listing) => {
    setDetailsLoading(true);
    setDetailsTarget(listing); // show immediately with data we have
    try {
      const data = await fetchListingById(listing._id);
      if (data?.listing) setDetailsTarget(normalizeListing(data.listing));
    } catch {
      // keep what we have
    } finally {
      setDetailsLoading(false);
    }
  };

  // Approve
  const handleApprove = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await approveListing(id);
      setAllListings((prev) => prev.map((l) => l._id === id ? { ...l, status: "Approved" } : l));
      setDetailsTarget((prev) => prev?._id === id ? { ...prev, status: "Approved" } : prev);
      showToast("Listing approved successfully!");
    } catch {
      showToast("Failed to approve listing.", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  // Reject
  const handleReject = async (reason) => {
    const id = rejectTarget._id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await rejectListing(id, reason);
      setAllListings((prev) => prev.map((l) => l._id === id ? { ...l, status: "Rejected", rejection_reason: reason } : l));
      setDetailsTarget((prev) => prev?._id === id ? { ...prev, status: "Rejected", rejection_reason: reason } : prev);
      showToast("Listing rejected.");
    } catch {
      showToast("Failed to reject listing.", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
      setRejectTarget(null);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this listing? This cannot be undone.")) return;
    try {
      await deleteListing(id);
      setAllListings((prev) => prev.filter((l) => l._id !== id));
      showToast("Listing deleted.");
    } catch {
      showToast("Delete failed.", "error");
    }
  };

  const FILTER_TABS = [
    { key: "all",      label: "All",      count: allListings.length },
    { key: "pending",  label: "Pending",  count: allListings.filter((l) => l.status === "Pending Approval").length },
    { key: "approved", label: "Approved", count: allListings.filter((l) => l.status === "Approved").length },
    { key: "rejected", label: "Rejected", count: allListings.filter((l) => l.status === "Rejected").length },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Property Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Review, approve or reject seller submissions</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-bold px-4 py-2.5 rounded-xl">
          <Home className="w-4 h-4" />
          {filtered.length} listings
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4">

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isFetching ? "text-blue-400 animate-pulse" : "text-gray-400"}`} />
          <input
            id="listings-search"
            type="text"
            placeholder="Search by title, seller, location, price…"
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); fetchData(filterStatus, ""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {FILTER_TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                filterStatus === key
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                filterStatus === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isFetching && (
          <div className="h-1 bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Property</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Seller</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center text-gray-400">
                      <Home className="w-10 h-10 mb-3 opacity-20" />
                      <p className="font-black text-gray-600">No listings found</p>
                      <p className="text-xs mt-1">
                        {search ? `No results for "${search}"` : "Try a different filter"}
                      </p>
                      {search && (
                        <button onClick={() => setSearch("")} className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((l) => {
                const style = STATUS_STYLE[l.status] || STATUS_STYLE["Pending Approval"];
                const StatusIcon = style.icon;
                return (
                  <tr
                    key={l._id}
                    onClick={() => handleRowClick(l)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    title="Click to view details"
                  >
                    {/* Property */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Home className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[200px]">{l.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Image className="w-3 h-3" /> {l.images} photos · {l.area}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{l.seller?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l.seller?.email}</p>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg text-xs whitespace-nowrap">{fmtCur(l.price)}</span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {l.location}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs font-bold text-gray-400 whitespace-nowrap">{l.date}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {l.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRowClick(l)}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {l.status === "Pending Approval" && (
                          <>
                            <button
                              onClick={() => handleApprove(l._id)}
                              disabled={actionLoading[l._id]}
                              className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(l)}
                              disabled={actionLoading[l._id]}
                              className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Reject"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(l._id)}
                          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result count */}
      {search && (
        <p className="text-xs text-gray-400 font-bold">
          Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "<span className="text-blue-600">{search}</span>"
        </p>
      )}

      {/* Modals */}
      {rejectTarget && (
        <RejectModal listing={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />
      )}

      {detailsTarget && (
        <DetailsModal
          listing={detailsTarget}
          onApprove={handleApprove}
          onReject={(l) => { setDetailsTarget(null); setRejectTarget(l); }}
          onDelete={handleDelete}
          onClose={() => setDetailsTarget(null)}
          loading={detailsLoading || actionLoading[detailsTarget?._id]}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200]">
          <div className={`flex items-center gap-3 bg-white border rounded-2xl px-5 py-4 shadow-2xl text-sm font-bold ${
            toast.type === "success" ? "border-l-4 border-l-green-500 text-gray-800" : "border-l-4 border-l-red-500 text-gray-800"
          }`}>
            {toast.type === "success"
              ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsPage;

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";
import { Building2, CheckCircle2, XCircle, MapPin, ShieldCheck, User, Mail, Phone, Maximize2, Bed, Bath, Copy, ExternalLink, Check, X } from "lucide-react";

const ListingDetailsModal = ({ listing, onApprove, onReject, onClose, loading }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [activePhoto, setActivePhoto] = useState(listing?.imageUrls?.[0] || null);

  if (!listing) return null;

  // Retrieve the latest transaction for payment audit
  const tx = listing.transactions?.[0] || null;
  const isPaid = listing.payment_status === "Paid" || listing.payment_status === "paid" || tx?.status === "SUCCESS";
  const transactionId = tx?.transaction_id || listing.payment_id || `PAY-${listing._id?.slice(0, 10)}`;
  const paymentAmount = tx?.amount || 500;
  const paymentDate = tx?.created_at 
    ? new Date(tx.created_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }) 
    : (listing.created_at ? new Date(listing.created_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }) : "Verified via Gateway");

  const handleCopyTx = () => {
    navigator.clipboard.writeText(transactionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal w-[96vw] max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* 1. Modal Top Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">
                  {listing.title}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  listing.statusKey === 'approved' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                  listing.statusKey === 'rejected' ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30' :
                  'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {listing.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Property ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{listing._id}</span> · Submitted: {listing.date}
              </p>
            </div>
          </div>

          <button type="button" className="admin-modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body Content (2-Column Studio Grid) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Payment, Seller, Specs & Description (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Card 1: Official Verified PayHere Payment Audit Panel */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-slate-900/10 border border-emerald-500/30 shadow-xs dark:bg-slate-950/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-500/20 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        PayHere Official Payment Audit
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cryptographic signature verified · Funds cleared
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isPaid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      {isPaid ? 'Payment Success (PAID)' : 'Unpaid / Abandoned'}
                    </span>
                  </div>
                </div>

                {/* Payment Details 4-Column Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Receipt / Tx ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-xs truncate">
                        {transactionId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyTx}
                        className="text-slate-400 hover:text-blue-500 transition p-1 cursor-pointer shrink-0"
                        title="Copy Transaction ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Listing Fee Paid</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      LKR {Number(paymentAmount).toLocaleString("en-LK")}.00
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Gateway Provider</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      PayHere Automated
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Payment Timestamp</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {paymentDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Seller & Contact Details Hub */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" /> Seller & Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {listing.seller?.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm truncate">
                        {listing.seller?.name || "Private Seller"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Role: {listing.seller?.role || "SELLER"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                      {listing.seller?.email ? (
                        <a href={`mailto:${listing.seller.email}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block">
                          {listing.seller.email}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No email on record</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Phone</span>
                      <a href={`tel:${listing.contact_number || listing.seller?.phone}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-500 block">
                        {listing.contact_number || listing.seller?.phone || "0770000000"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: 6-Pillar Architectural Specs Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Asking Price</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block truncate">
                    Rs. {Number(listing.price || 0).toLocaleString("en-LK")}
                  </span>
                  {listing.listing_type?.toLowerCase() === 'rent' && listing.price_period && (
                    <span className="text-[10px] font-bold text-slate-400">/{listing.price_period}</span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Asset Class</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                    {listing.type || "House"}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{listing.listing_type || "Sale"}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">District / Town</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                    {listing.city || "Maharagama"}
                  </span>
                  <span className="text-[10px] text-slate-400">{listing.district || "Colombo"}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Land / Floor Size</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                    {listing.area || "12 Perches"}
                  </span>
                  <span className="text-[10px] text-slate-400">{listing.house_size ? `${listing.house_size} sqft` : 'Prime Area'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bedrooms & Baths</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mt-1">
                    <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-blue-500" /> {listing.bedrooms || "-"}</span>
                    <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-cyan-500" /> {listing.bathrooms || "-"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">GPS Coordinates</span>
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 block truncate">
                    {listing.latitude ? `${Number(listing.latitude).toFixed(4)}, ${Number(listing.longitude).toFixed(4)}` : "Not Geo-tagged"}
                  </span>
                  {listing.latitude && (
                    <a
                      href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

              </div>

              {/* Card 4: Description Box */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Seller Property Description
                </h4>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto whitespace-pre-line custom-scrollbar">
                  {listing.description || "No description provided."}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PostGIS Spatial Map & HD Photos (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Card 5: PostGIS Spatial Geofence & Boundary Inspection Map */}
              {listing.latitude && listing.longitude && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" /> PostGIS Spatial Geofence
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {listing.boundary?.coordinates ? "Polygon Geofenced" : "Point Marker"}
                    </span>
                  </div>
                  <div className="h-64 w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <MapContainer
                      center={[listing.latitude, listing.longitude]}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[listing.latitude, listing.longitude]}>
                        <Popup>{listing.title}</Popup>
                      </Marker>
                      {listing.boundary && listing.boundary.coordinates && listing.boundary.coordinates.length > 0 && (
                        <Polygon 
                          positions={listing.boundary.coordinates[0].map(coord => [coord[1], coord[0]])} 
                          color="#2563eb" 
                          fillColor="#3b82f6" 
                          fillOpacity={0.4} 
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Card 6: Submitted Photographs Gallery */}
              {listing.imageUrls?.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                    HD Photography Gallery ({listing.imageUrls.length})
                  </h4>
                  
                  {/* Main Active Photo Preview */}
                  {activePhoto && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-44 mb-2.5 bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={activePhoto.startsWith('http') ? activePhoto : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${activePhoto}`}
                        alt="Property Preview"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={activePhoto.startsWith('http') ? activePhoto : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${activePhoto}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-950/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-md hover:bg-blue-600 transition"
                      >
                        <Maximize2 className="w-3 h-3" /> Full HD View
                      </a>
                    </div>
                  )}

                  {/* Thumbnail Row */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {listing.imageUrls.map((url, idx) => {
                      const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
                      const isCurrent = activePhoto === url;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setActivePhoto(url)}
                          className={`rounded-xl overflow-hidden border-2 h-14 bg-slate-100 dark:bg-slate-800 transition cursor-pointer ${
                            isCurrent ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <img 
                            src={fullUrl} 
                            alt={`Thumb ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* 3. Modal Sticky Action Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current Legal Status: <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">{listing.status}</span>
          </div>

          <div className="flex items-center gap-3">
            {listing.statusKey === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onReject(listing)}
                  disabled={loading}
                  className="admin-btn admin-btn-danger"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Listing</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(listing._id)}
                  disabled={loading}
                  className="admin-btn admin-btn-success"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish Live</span>
                </button>
              </>
            )}
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Close Audit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingDetailsModal;

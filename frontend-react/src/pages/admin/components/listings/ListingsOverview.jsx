import React from "react";
import { Building2, Search, Filter, Eye, Trash2, MapPin, Check } from "lucide-react";

const ListingsOverview = ({ search, setSearch, listings, filter, setFilter, filteredListings, handleViewDetails, handleDelete }) => (
    <>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Property Listings & Spatial Audit</h1>
          <p>Verify PayHere transaction receipts, PostGIS boundaries, and legal deed documents</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="admin-search-bar">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { key: "all", label: "All Paid Listings" },
          { key: "pending", label: "Pending Audit", badge: listings.filter(l => l.statusKey === 'pending').length },
          { key: "approved", label: "Live & Approved", badge: listings.filter(l => l.statusKey === 'approved').length },
          { key: "rejected", label: "Rejected / Defective", badge: listings.filter(l => l.statusKey === 'rejected').length },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              filter === key
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                filter === key ? "bg-white text-blue-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Listings Data Table */}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Price (LKR)</th>
              <th>Seller</th>
              <th>Payment & Audit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No property listings found</p>
                  <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                </td>
              </tr>
            ) : (
              filteredListings.map((listing) => (
                <tr key={listing._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {listing.imageUrls?.[0] ? (
                          <img src={listing.imageUrls[0].startsWith('http') ? listing.imageUrls[0] : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${listing.imageUrls[0]}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                            HD
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm truncate max-w-xs">
                          {listing.title}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {listing._id?.slice(0, 8)} · {listing.type || "House"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {listing.location}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Rs. {Number(listing.price || 0).toLocaleString("en-LK")}
                    </span>
                    {listing.listing_type?.toLowerCase() === 'rent' && listing.price_period && (
                      <span className="text-[10px] text-slate-400 block">/{listing.price_period}</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {listing.seller?.name || "Seller"}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                      {listing.seller?.email || "-"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`admin-badge ${
                        listing.statusKey === 'approved' ? 'admin-badge-approved' :
                        listing.statusKey === 'rejected' ? 'admin-badge-rejected' :
                        'admin-badge-pending'
                      }`}>
                        {listing.status}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Paid & Verified
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(listing._id)}
                        className="admin-btn admin-btn-sm admin-btn-primary"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
);

export default ListingsOverview;

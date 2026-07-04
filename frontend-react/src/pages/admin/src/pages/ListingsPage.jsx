import React, { useState, useEffect, useCallback } from "react";
import { fetchListings, approveListing, rejectListing, deleteListing } from "../api/adminApi";
import "../styles/global.css";

// ── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ listing, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="card-title">Reject Listing</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>
          You are rejecting: <strong style={{ color: "var(--text-primary)" }}>{listing?.title}</strong>
        </p>
        <div className="form-group">
          <label className="form-label">Rejection Reason (required)</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Please provide a clear reason for rejecting this listing…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_LISTINGS = [
  { _id: "1", title: "3.5 Perches Land, Kandy City", seller: { name: "Chaminda Perera", email: "chaminda@mail.com" }, price: 4200000, area: "3.5 perches", status: "Pending Approval", date: "2026-04-25", location: "Kandy", images: 3 },
  { _id: "2", title: "10 Acres Farm Land, Nuwara Eliya", seller: { name: "Nimal Silva", email: "nimal@mail.com" }, price: 18000000, area: "10 acres", status: "Approved", date: "2026-04-20", location: "Nuwara Eliya", images: 5 },
  { _id: "3", title: "Commercial Plot, Colombo 7", seller: { name: "Yasith Fernando", email: "yasith@mail.com" }, price: 28000000, area: "8 perches", status: "Pending Approval", date: "2026-04-27", location: "Colombo", images: 4 },
  { _id: "4", title: "Residential Land, Gampaha", seller: { name: "Priya Kumari", email: "priya@mail.com" }, price: 6500000, area: "6 perches", status: "Rejected", date: "2026-04-22", location: "Gampaha", images: 2 },
  { _id: "5", title: "Paddy Field, Anuradhapura", seller: { name: "Bandula Ratne", email: "bandula@mail.com" }, price: 3200000, area: "2 acres", status: "Approved", date: "2026-04-18", location: "Anuradhapura", images: 3 },
  { _id: "6", title: "Highland Land, Badulla", seller: { name: "Saman Herath", email: "saman@mail.com" }, price: 8800000, area: "15 perches", status: "Pending Approval", date: "2026-04-28", location: "Badulla", images: 4 },
];

const STATUS_COLORS = {
  "Pending Approval": "warning",
  "Approved": "approved",
  "Rejected": "rejected",
  "Sold": "sold",
};

const STATUS_LABELS = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  sold: "Sold",
};

const normalizeListing = (listing) => {
  const statusKey = (listing.status || "pending").toLowerCase();

  return {
    ...listing,
    _id: listing.id || listing._id,
    seller: listing.seller || {
      name: listing.seller_name || "Seller",
      email: listing.seller_email || "",
    },
    area: listing.area || (listing.land_size ? `${listing.land_size} perches` : "-"),
    status: STATUS_LABELS[statusKey] || listing.status || "Pending Approval",
    date: listing.date || listing.created_at?.slice(0, 10) || "-",
    location: listing.location || listing.address || "-",
    images: Array.isArray(listing.images) ? listing.images.length : listing.images || 0,
  };
};

const ListingsPage = () => {
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load live data
  useEffect(() => {
    fetchListings({ status: filter === "all" ? undefined : filter })
      .then((data) => setListings((data?.listings || []).map(normalizeListing)))
      .catch(() => {});
  }, [filter]);

  const handleApprove = async (id) => {
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      await approveListing(id);
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: "Approved" } : l))
      );
      showToast("Listing approved successfully!");
    } catch {
      showToast("Failed to approve listing.", "error");
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleReject = async (reason) => {
    const id = rejectTarget._id;
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      await rejectListing(id, reason);
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: "Rejected" } : l))
      );
      showToast("Listing rejected.");
    } catch {
      showToast("Failed to reject listing.", "error");
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
      setRejectTarget(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this listing?")) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
      showToast("Listing deleted.");
    } catch {
      showToast("Delete failed.", "error");
    }
  };

    const filtered = listings.filter((l) => {
    const matchStatus = filter === "all" || l.status.toLowerCase().includes(filter);
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.seller?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n)}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Property Listings</h1>
          <p>Review, approve, or reject seller submissions</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {filtered.length} listings
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
          <span style={{ color: "var(--text-muted)" }}>🔍</span>
          <input
            placeholder="Search by title, seller, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            className={`btn ${filter === s ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Area</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏠</div>
                      <h3>No listings found</h3>
                      <p>Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{l.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      📷 {l.images} photos
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.875rem" }}>{l.seller?.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{l.seller?.email}</div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{fmtCur(l.price)}</td>
                  <td style={{ fontSize: "0.85rem" }}>{l.area}</td>
                  <td style={{ fontSize: "0.85rem" }}>{l.location}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{l.date}</td>
                  <td>
                    <span className={`badge badge-${STATUS_COLORS[l.status] || "active"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {l.status === "Pending Approval" && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(l._id)}
                            disabled={loading[l._id]}
                            title="Approve"
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setRejectTarget(l)}
                            disabled={loading[l._id]}
                            title="Reject"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(l._id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsPage;

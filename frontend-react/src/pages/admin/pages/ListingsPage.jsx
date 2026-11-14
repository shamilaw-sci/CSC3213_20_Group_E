import ListingDetailsModal from "../components/listings/ListingDetailsModal";
import ListingsOverview from "../components/listings/ListingsOverview";
import RejectModal from "../components/listings/RejectModal";
import React, { useState } from "react";
import { fetchListings, fetchListingById, approveListing, rejectListing, deleteListing } from "../api/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/admin-global.css";
import "lucide-react";

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

// ── Reject Modal ─────────────────────────────────────────────────────────────
// ── Detailed Inspection Modal (Full-Width 2-Column Command Studio) ───────────────
const normalizeListing = (listing) => {
  const statusKey = (listing.status || "pending").toLowerCase();
  const sellerObj = listing.seller || listing.users || {};
  return {
    ...listing,
    _id: listing.id || listing._id,
    seller: {
      id: sellerObj.id || listing.seller_id,
      name: sellerObj.name || listing.seller_name || "Seller",
      email: sellerObj.email || listing.seller_email || "",
      phone: sellerObj.phone || listing.seller_phone || listing.contact_number || "",
      role: sellerObj.role || listing.seller_role || "SELLER"
    },
    transactions: listing.transactions || [],
    payment_status: listing.payment_status || "Paid",
    area: listing.area || (listing.land_size ? `${listing.land_size} perches` : (listing.house_size ? `${listing.house_size} sqft` : "-")),
    status: statusKey === "approved" ? "Approved" : (statusKey === "rejected" ? "Rejected" : "Pending Verification"),
    statusKey,
    date: listing.date || (listing.created_at ? new Date(listing.created_at).toLocaleDateString("en-LK") : "-"),
    location: listing.location || listing.city || listing.district || listing.address || "-",
    imageUrls: Array.isArray(listing.images) ? listing.images : [],
    images: Array.isArray(listing.images) ? listing.images.length : (listing.images || 0),
  };
};

const ListingsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ['adminListings', filter],
    queryFn: async () => {
      const data = await fetchListings({ status: filter === "all" ? undefined : filter });
      return (data?.listings || []).map(normalizeListing);
    }
  });

  const approveMutation = useMutation({
    mutationFn: approveListing,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminListings'] });
      toast.success("Property approved and published live!");
      if (detailsTarget?._id === id) {
        setDetailsTarget((prev) => ({ ...prev, status: "Approved", statusKey: "approved" }));
      }
    },
    onError: () => toast.error("Failed to approve property.")
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminListings'] });
      setRejectTarget(null);
      setDetailsTarget(null);
      toast.success("Property rejected and feedback dispatched to seller.");
    },
    onError: () => toast.error("Failed to reject property.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminListings'] });
      toast.success("Listing deleted permanently.");
    },
    onError: () => toast.error("Failed to delete listing.")
  });

  const handleViewDetails = async (id) => {
    try {
      const data = await fetchListingById(id);
      setDetailsTarget(normalizeListing(data.listing));
    } catch (error) {
      toast.error("Failed to fetch property details");
      const listing = listings.find((l) => l._id === id);
      if (listing) setDetailsTarget(listing);
    }
  };

  const handleApprove = (id) => approveMutation.mutate(id);
  const handleRejectConfirm = (reason) => {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget._id, reason });
  };
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    deleteMutation.mutate(id);
  };

  const filteredListings = listings.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.seller?.name?.toLowerCase().includes(q) ||
      l._id?.toLowerCase().includes(q)
    );
  });

  const loadingAction = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      
      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Comprehensive Executive Inspection Modal */}
      {detailsTarget && !rejectTarget && (
        <ListingDetailsModal
          listing={detailsTarget}
          onApprove={handleApprove}
          onReject={(l) => {
            setRejectTarget(l);
          }}
          onClose={() => setDetailsTarget(null)}
          loading={loadingAction}
        />
      )}

      <ListingsOverview
        search={search}
        setSearch={setSearch}
        listings={listings}
        filter={filter}
        setFilter={setFilter}
        filteredListings={filteredListings}
        handleViewDetails={handleViewDetails}
        handleDelete={handleDelete}
      />

    </div>
  );
};

export default ListingsPage;

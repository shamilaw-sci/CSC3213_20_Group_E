import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const RejectModal = ({ listing, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal max-w-lg">
        <div className="admin-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="admin-card-title">Reject Property Listing</h3>
          </div>
          <button type="button" className="admin-modal-close" onClick={onCancel}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-300 mb-4">
          You are rejecting listing: <strong className="text-slate-900 dark:text-white">{listing?.title}</strong>. Please provide a specific reason so the seller can amend the submission.
        </p>
        <div className="admin-form-group">
          <label className="admin-form-label">Defect / Rejection Reason (Required)</label>
          <textarea
            className="admin-form-control"
            rows={4}
            placeholder="e.g. Deed boundary does not match PostGIS coordinates; missing clear survey plan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
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

export default RejectModal;

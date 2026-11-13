import React, { useEffect, useState } from 'react';
import { Check, X, ShieldAlert, FileText, Building, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as adminApi from '../api/adminApi';
import "../styles/admin-global.css";

const AgentApprovalsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingAgentId, setRejectingAgentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await adminApi.fetchPendingAgents();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Error fetching pending agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, newRole, reason = null) => {
    try {
      await adminApi.updateUserRole(id, newRole, reason);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (newRole === 'REJECTED_AGENT') {
        setRejectingAgentId(null);
        setRejectReason('');
        showToast('Agent application rejected.');
      } else {
        showToast('Agent credentials approved successfully!');
      }
    } catch (err) {
      showToast(`Update failed: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return;
    handleAction(rejectingAgentId, 'REJECTED_AGENT', rejectReason);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toastMsg.type}`}>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Agent Credentials & Licensing</h1>
          <p>Review and verify real estate broker applications, CEA licenses & agency affiliations</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
          {agents.length} Applications Pending
        </span>
      </div>

      {/* Agent Applications Grid */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="admin-spinner"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="admin-card text-center py-16">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-white">No Pending Agent Applications</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All broker and agency license verification requests have been processed.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="admin-card relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                      {agent.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{agent.name}</h3>
                      <p className="text-xs text-slate-400">{agent.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    License Pending
                  </span>
                </div>

                <div className="space-y-2.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-800 text-xs mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agency Name:</span>
                    <span className="font-bold text-white">{agent.agency_name || "Independent Broker"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CEA License No:</span>
                    <span className="font-mono font-bold text-blue-400">{agent.license_number || "PENDING-DOCS"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applied On:</span>
                    <span className="text-slate-300">{agent.created_at ? new Date(agent.created_at).toLocaleDateString("en-LK") : "-"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingAgentId(agent.id)}
                  className="flex-1 admin-btn admin-btn-danger"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(agent.id, 'AGENT')}
                  className="flex-1 admin-btn admin-btn-success"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve License</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingAgentId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="admin-card-title">Reject Agent Application</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setRejectingAgentId(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Reason for Rejection</label>
              <textarea
                className="admin-form-control"
                rows={3}
                placeholder="e.g. Invalid real estate registration license number..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRejectingAgentId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgentApprovalsPage;

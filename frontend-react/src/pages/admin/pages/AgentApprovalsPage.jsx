import { logClientError } from '../../../utils/clientLog';
import React, { useEffect, useState } from 'react';
import { Check, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as adminApi from '../api/adminApi';
import "../styles/admin-global.css";

const AgentApprovalsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingAgentId, setRejectingAgentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [reviewingAgent, setReviewingAgent] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await adminApi.fetchPendingAgents();
      setAgents((data.agents || []).map(agent => ({ ...agent, profile: (Array.isArray(agent.agent_profiles) ? agent.agent_profiles[0] : agent.agent_profiles) || {} })));
    } catch (err) {
      logClientError('admin_pending_agents_load_failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, newRole, reason = null) => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await adminApi.updateUserRole(id, newRole, reason);
      setReviewingAgent(null);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (newRole === 'REJECTED_AGENT') {
        setRejectingAgentId(null);
        setRejectReason('');
        showToast(result?.warning || 'Agent application rejected.', result?.warning ? 'error' : 'success');
      } else {
        showToast('Agent credentials approved successfully!');
      }
    } catch (err) {
      showToast(`Update failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setSaving(false);
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
        <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs">
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Pending Agent Applications</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
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
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{agent.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{agent.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    License Pending
                  </span>
                </div>

                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Agency Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{agent.profile.agency_name || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CEA License No:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{agent.profile.license_number || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Applied On:</span>
                    <span className="text-slate-700 dark:text-slate-300">{agent.created_at ? new Date(agent.created_at).toLocaleDateString("en-LK") : "-"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="admin-btn admin-btn-secondary w-full" onClick={() => setReviewingAgent(agent)}>
                  <FileText className="w-4 h-4" /> Review Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewingAgent && !rejectingAgentId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-xl max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="agent-detail-title">
            <div className="admin-modal-header">
              <h3 id="agent-detail-title" className="admin-card-title">Agent Application Details</h3>
              <button type="button" aria-label="Close application details" className="admin-modal-close" onClick={() => setReviewingAgent(null)}><X className="w-4 h-4" /></button>
            </div>
            <dl className="space-y-3 text-sm text-slate-900 dark:text-slate-100">
              {[
                ['Name', reviewingAgent.name], ['Email', reviewingAgent.email], ['Phone', reviewingAgent.phone],
                ['Status', reviewingAgent.role], ['Applied On', reviewingAgent.created_at ? new Date(reviewingAgent.created_at).toLocaleDateString('en-LK') : null],
                ['Agency', reviewingAgent.profile.agency_name], ['License Number', reviewingAgent.profile.license_number], ['Biography', reviewingAgent.profile.bio]
              ].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words">{value || 'Not provided'}</dd></div>)}
            </dl>
            <div className="flex gap-3 mt-6">
              <button type="button" disabled={saving} className="admin-btn admin-btn-danger flex-1" onClick={() => { setRejectReason(''); setRejectingAgentId(reviewingAgent.id); }}><X className="w-4 h-4" />Reject</button>
              <button type="button" disabled={saving} className="admin-btn admin-btn-success flex-1" onClick={() => handleAction(reviewingAgent.id, 'AGENT')}><Check className="w-4 h-4" />Approve License</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingAgentId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md" role="dialog" aria-modal="true" aria-labelledby="agent-reject-title">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 id="agent-reject-title" className="admin-card-title">Reject Agent Application</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setRejectingAgentId(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-form-group">
              <label htmlFor="agent-reject-reason" className="admin-form-label">Reason for Rejection</label>
              <textarea
                id="agent-reject-reason"
                maxLength={2000}
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
                disabled={saving || !rejectReason.trim()}
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

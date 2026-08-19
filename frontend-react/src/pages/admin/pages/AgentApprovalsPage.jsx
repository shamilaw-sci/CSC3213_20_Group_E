import React, { useEffect, useState } from 'react';
import { Check, X, ShieldAlert, FileText, Building } from 'lucide-react';
import * as adminApi from '../api/adminApi';
import toast from 'react-hot-toast';

const AgentApprovalsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [rejectingAgentId, setRejectingAgentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const data = await adminApi.fetchPendingAgents();
        setAgents(data.agents || []);
        setError(null);
      } catch (err) {
        (toast.error('Error fetching pending agents:'), console.error('Error fetching pending agents:', err));
        setError('Failed to load pending agents.');
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const handleAction = async (id, newRole, reason = null) => {
    try {
      await adminApi.updateUserRole(id, newRole, reason);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (newRole === 'REJECTED_AGENT') {
          setRejectingAgentId(null);
          setRejectReason('');
      }
    } catch (err) {
      (toast.error(`Failed to update role to ${newRole}:`), console.error(`Failed to update role to ${newRole}:`, err));
      alert(`Error: ${err.message || 'Update failed'}`);
    }
  };

  const handleRejectSubmit = () => {
      if (!rejectReason.trim()) {
          alert("Please provide a reason for rejection.");
          return;
      }
      handleAction(rejectingAgentId, 'REJECTED_AGENT', rejectReason);
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Approvals</h1>
          <p className="text-gray-500 mt-1">Review and verify new real estate agents.</p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          {agents.length} Pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">{error}</div>
      )}

      {agents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">There are no pending agent registrations to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const profile = Array.isArray(agent.agent_profiles) ? (agent.agent_profiles[0] || {}) : (agent.agent_profiles || {});
            return (
              <div key={agent.id || agent._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">PENDING</span>
                  </div>

                  <div className="space-y-3 mt-4 text-sm">
                    <div className="flex items-center text-gray-700 gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Agency:</span>
                      <span>{profile.agency_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">License:</span>
                      <span>{profile.license_number || 'N/A'}</span>
                    </div>
                  </div>

                  {profile.bio && (
                    <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-gray-600 line-clamp-3">"{profile.bio}"</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 flex flex-col gap-2 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRejectingAgentId(agent.id)} className="flex-1 flex items-center justify-center gap-1 py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium transition text-sm">
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button type="button" onClick={() => handleAction(agent.id, 'AGENT')} className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-sm text-sm">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </div>
                  <button type="button" onClick={() => { if(window.confirm('Are you sure you want to permanently ban this agent?')) handleAction(agent.id, 'BANNED') }} className="w-full py-2 px-3 text-red-700 hover:underline text-xs font-medium transition text-center">
                    Ban Permanently
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAgentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Agent Application</h3>
                  <p className="text-gray-600 mb-4 text-sm">Please provide a reason for rejection. This will be shown to the agent so they can correct their details and resubmit.</p>
                  
                  <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4 outline-none"
                      placeholder="e.g. Please provide a valid real estate license number."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>

                  <div className="flex gap-3 justify-end">
                      <button onClick={() => { setRejectingAgentId(null); setRejectReason(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
                          Cancel
                      </button>
                      <button onClick={handleRejectSubmit} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
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

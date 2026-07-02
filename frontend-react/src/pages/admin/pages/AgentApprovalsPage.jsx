import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Check, X, ShieldAlert, FileText, Phone, Building } from 'lucide-react';

const AgentApprovalsPage = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAdminAuth();
    const token = localStorage.getItem("admin_token");

    const fetchPendingAgents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/pending-agents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgents(response.data.agents || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending agents:', err);
            setError('Failed to load pending agents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPendingAgents();
    }, [token]);

    const handleAction = async (id, newRole) => {
        try {
            await axios.patch(`http://localhost:5000/api/admin/users/${id}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove agent from the list
            setAgents(agents.filter(agent => agent.id !== id));
        } catch (err) {
            console.error(`Failed to update role to ${newRole}:`, err);
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
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
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            {agents.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">There are no pending agent registrations to review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map(agent => {
                        const profile = Array.isArray(agent.agent_profiles) 
                            ? (agent.agent_profiles[0] || {}) 
                            : (agent.agent_profiles || {});
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
                                
                                <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-200">
                                    <button aria-label="Accessible interactive control" type="button" 
                                        onClick={() => handleAction(agent.id, 'BANNED')}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium transition"
                                    >
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                    <button aria-label="Accessible interactive control" type="button" 
                                        onClick={() => handleAction(agent.id, 'AGENT')}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-sm"
                                    >
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AgentApprovalsPage;

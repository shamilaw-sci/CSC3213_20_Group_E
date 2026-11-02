import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';

const SellerConversationsPanel = ({ loading, recentConversations, navigate }) => {
    return (
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Buyer Chats</h2>
                                </div>
                                <Link to="/messages" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                    Open Inbox
                                </Link>
                            </div>

                            {loading ? (
                                <div className="py-6 flex justify-center">
                                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : recentConversations.length === 0 ? (
                                <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                                    No active inquiries yet. Inquiries will appear here as soon as buyers message you.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {recentConversations.map(conv => (
                                        <div 
                                            key={conv.id}
                                            onClick={() => navigate('/messages')}
                                            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-800 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                                                    {(conv.buyer?.name || 'Buyer').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900 dark:text-white">
                                                        {conv.buyer?.name || 'Prospective Buyer'}
                                                    </span>
                                                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                                        {conv.property?.title || 'Property Inquiry'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
    );
};

export default SellerConversationsPanel;

import { Calendar, Heart, Search, Calculator, FileText, User, Moon, Building2 } from 'lucide-react';
import { m } from 'framer-motion';

const ProfileTabs = ({ userRole, activeTab, appointmentCount, favoriteCount, savedSearchCount, onTabChange }) => (
                <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-[1px] custom-scrollbar">
                    {[
                        { key: 'appointments', label: 'My Appointments & Tours', count: appointmentCount, icon: Calendar },
                        { key: 'favorites', label: 'Saved Shortlist', count: favoriteCount, icon: Heart },
                        { key: 'searches', label: 'Search Radars', count: savedSearchCount, icon: Search },
                        { key: 'calculator', label: 'Home Loan & EMI Planner', icon: Calculator },
                        { key: 'dueDiligence', label: 'Due-Diligence Guide', icon: FileText },
                        { key: 'profile', label: 'Profile & Security', icon: User },
                        { key: 'preferences', label: 'Theme & Preferences', icon: Moon },
                        ...(userRole === 'AGENT' || userRole === 'PENDING_AGENT' ? [{ key: 'agentSettings', label: 'Agent Brand Settings', icon: Building2 }] : [])
                    ].map(({ key, label, count, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onTabChange(key)}
                            className={`px-4 py-3 font-bold text-xs sm:text-sm capitalize transition-colors relative whitespace-nowrap flex items-center gap-2 cursor-pointer
                                ${activeTab === key ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                            {count !== undefined && count > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-black">
                                    {count}
                                </span>
                            )}
                            {activeTab === key && (
                                <m.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                            )}
                        </button>
                    ))}
                </div>
);

export default ProfileTabs;

import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/UserAuthContext';
import { Bell, MessageSquare, User, PlusCircle, Compass, Calendar } from "lucide-react";
import usePoll from '../../hooks/usePoll';
import "./Navbar.css";

/**
 * Global Navigation Bar Component (Premium Enterprise Edition)
 * Features balanced 3-zone layout: Left Brand Logo, Center Nav Links, Right Actions & Profile.
 */
const Navbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Polls /conversations/unread every 15 seconds while user is logged in.
  const { data: unreadData } = usePoll("/conversations/unread", 15000, { enabled: !!user });
  const unreadCount = unreadData?.unreadCount || 0;
  const recentMessages = unreadData?.recentMessages || [];

  const isSeller = user?.role === "SELLER";
  const isAgent = user?.role === "AGENT";

  return (
    <nav className={`transition-all duration-300 ${
      transparent 
        ? 'absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/75 via-black/35 to-transparent text-white backdrop-blur-[2px]' 
        : 'sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800/80 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-20 items-center gap-4">
          
          {/* --- Zone 1: Left Brand Logo --- */}
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group"
            onClick={() => navigate("/")}
          >
            <img
              src="/logo.jpeg"
              alt="Thirasara Logo"
              className="navbar-logo h-8 w-8 sm:h-9 sm:w-9 rounded-xl shadow-xs group-hover:scale-105 transition duration-200"
            />
            <span className={`text-xl sm:text-2xl font-black tracking-tight ${
              transparent ? 'text-white drop-shadow-md' : 'text-blue-600 dark:text-blue-400'
            }`}>
              Thirasara
            </span>
          </div>

          {/* --- Zone 2: Center Primary Navigation (Generously & Evenly Spaced) --- */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 h-full">
            {isSeller ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/seller-dashboard")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
                    window.location.pathname === '/seller-dashboard'
                      ? transparent
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/my-properties")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    window.location.pathname === '/my-properties'
                      ? transparent
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  My Listings
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/map")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    window.location.pathname === '/map'
                      ? transparent
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Buy
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/rent")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    window.location.pathname === '/rent'
                      ? transparent
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Rent
                </button>
              </>
            ) : isAgent ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/agent-dashboard")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
                    window.location.pathname === '/agent-dashboard'
                      ? transparent
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Agent Hub
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/map")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Buy
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/rent")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Rent
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/agents")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Find an Agent
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/map")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Buy
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/rent")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Rent
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(user?.role === "SELLER" ? "/add-property" : "/login", {
                      state: user?.role === "SELLER" ? null : { message: "Please log in as a Seller to add a property." }
                    })
                  }
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Sell
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/agents")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Find an Agent
                </button>

                {(user?.role === 'BUYER' || user?.role === 'USER') && (
                  <button
                    type="button"
                    onClick={() => navigate("/buyer-dashboard")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
                      transparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-xs'
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    Buyer Hub
                  </button>
                )}
              </>
            )}
          </div>

          {/* --- Zone 3: Right Actions, Search, Alerts & Profile --- */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 h-full flex-shrink-0">
            
            {/* Direct "+ Add Property" Luxury CTA for Sellers */}
            {isSeller && (
              <button
                type="button"
                onClick={() => navigate("/add-property")}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  transparent 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Property</span>
              </button>
            )}

            {/* Map Search Pill */}
            <button
              type="button"
              onClick={() => navigate("/map")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                transparent 
                  ? 'text-white hover:bg-white/15 drop-shadow-xs' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Map Search</span>
            </button>

            {user ? (
              <>
                {/* 1-Click Direct Messages Button */}
                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  title="Messages & Inquiries"
                  className={`relative p-2 rounded-xl transition cursor-pointer ${
                    transparent 
                      ? 'text-white hover:bg-white/15' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Bell Dropdown */}
                <div className="group h-full flex items-center relative cursor-pointer">
                  <div className={`relative p-2 rounded-xl transition ${
                    transparent 
                      ? 'text-white hover:bg-white/15' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </div>

                  {/* Dropdown Menu for Notifications */}
                  <div className="absolute top-16 right-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-2xl py-2 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        Recent Inquiries
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {recentMessages.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-xs">
                          No new messages
                        </div>
                      ) : (
                        recentMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() =>
                              navigate(
                                `/messages?conversation=${msg.conversation_id}`
                              )
                            }
                            className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex gap-2.5 items-start"
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden text-xs">
                              {msg.sender?.avatar_url ? (
                                <img
                                  src={msg.sender.avatar_url}
                                  alt="Sender"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {msg.sender?.name || "Unknown"}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {msg.body || "Sent an attachment"}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/messages")}
                      className="w-full px-4 py-2 text-xs text-center text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold border-t border-gray-100 dark:border-gray-700"
                    >
                      View all inquiries
                    </button>
                  </div>
                </div>

                {/* Profile Pill & Dropdown */}
                <div className="group h-full flex items-center relative cursor-pointer">
                  <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 dark:hover:bg-gray-800 transition">
                    <div
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full p-[2px] ${
                        user.role === "SELLER"
                          ? "bg-gradient-to-tr from-orange-400 to-pink-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                          : user.role === "AGENT"
                          ? "bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          : "bg-gradient-to-tr from-blue-400 to-cyan-500 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-bold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hidden lg:flex flex-col text-left">
                      <span className={`text-xs font-bold transition leading-none ${
                        transparent ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        Hi, {user.name.split(" ")[0]}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${
                          user.role === "SELLER"
                            ? "text-orange-400"
                            : user.role === "AGENT"
                            ? "text-emerald-400"
                            : "text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="absolute top-16 right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-2xl py-2 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => navigate("/profile")}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      Profile & Settings
                    </button>
                    {(user.role === "BUYER" || user.role === "USER") && (
                      <button
                        type="button"
                        onClick={() => navigate("/buyer-dashboard")}
                        className="block w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/50"
                      >
                        Buyer Command Hub
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate("/buyer-dashboard?tab=appointments")}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      My Appointments
                    </button>
                    {user.role === "AGENT" && (
                      <button
                        type="button"
                        onClick={() => navigate(`/agent/${user.id}`)}
                        className="block w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/50"
                      >
                        My Public Agent Profile
                      </button>
                    )}
                    {(user.role === "SELLER" || user.role === "AGENT" || user.role === "PENDING_AGENT" || user.role === "REJECTED_AGENT") && (
                      <button
                        type="button"
                        onClick={() => navigate(user.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard")}
                        className="block w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/50"
                      >
                        {user.role === "SELLER" ? "Seller Dashboard" : "Agent Hub & CRM"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate("/favorites")}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      My Favorites
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/messages")}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      Messages
                    </button>
                    {user.role === "SELLER" && (
                      <button
                        type="button"
                        onClick={() => navigate("/my-properties")}
                        className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                      >
                        My Properties
                      </button>
                    )}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white border border-blue-600 dark:border-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2 rounded-xl transition duration-300 font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                Sign in
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
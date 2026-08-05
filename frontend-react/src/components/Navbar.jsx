import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserAuthContext";
import { useState, useEffect } from "react";
import { Bell, MessageSquare, User } from "lucide-react";
import api from "../context/api";
import "./Navbar.css";

/**
 * Global Navigation Bar Component.
 * Handles primary routing, user session state, and real-time notification polling.
 *
 * @component
 * @returns {React.ReactElement} Top navigation bar interface
 */
const Navbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get("/conversations/unread");
        setUnreadCount(res.data.unreadCount || 0);
        setRecentMessages(res.data.recentMessages || []);
      } catch (err) {
        console.error("Failed to fetch unread messages", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${transparent ? 'bg-transparent text-white' : 'bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-20 items-center">
          <div className="hidden md:flex items-center space-x-6 h-full">
            <div
              className="group h-full flex items-center relative cursor-pointer"
              onClick={() => navigate("/map")}
            >
              <span className={`font-medium px-2 py-8 transition duration-200 border-b-4 border-transparent ${transparent ? 'text-white hover:text-gray-300 group-hover:border-white' : 'text-gray-800 hover:text-blue-600 group-hover:border-blue-600'}`}>
                Buy
              </span>
            </div>
            <div
              className="h-full flex items-center cursor-pointer"
              onClick={() => navigate("/rent")}
            >
              <span className={`font-medium px-2 transition duration-200 ${transparent ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-blue-600'}`}>
                Rent
              </span>
            </div>
            <div
              className="h-full flex items-center cursor-pointer"
              onClick={() =>
                navigate(user?.role === "SELLER" ? "/add-property" : "/login", {
                  state: user?.role === "SELLER" ? null : { message: "Please log in as a Seller to add a property." }
                })
              }
            >
              <span className={`font-medium px-2 transition duration-200 ${transparent ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-blue-600'}`}>
                Sell
              </span>
            </div>
            <div
              className="h-full flex items-center cursor-pointer"
              onClick={() => navigate("/agents")}
            >
              <span className={`font-medium px-2 transition duration-200 ${transparent ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-blue-600'}`}>
                Find an agent
              </span>
            </div>
          </div>

          <div
            className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
              <img
                src="/logo.jpeg"
                alt="Thirasara Logo"
                className="navbar-logo h-8 w-8 rounded-lg"
              />
              Thirasara
            </h1>
          </div>

          <div className="flex items-center space-x-6 h-full">
            <button
              onClick={() => navigate("/map")}
              className={`font-medium transition hidden md:block ${transparent ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-blue-600'}`}
            >
              Map Search
            </button>

            {user && (
              <div className="group h-full flex items-center relative cursor-pointer ml-4">
                <div className={`relative p-2 transition ${transparent ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'}`}>
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="absolute top-16 right-0 w-72 bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-lg py-2 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">
                      Recent Messages
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {recentMessages.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
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
                          className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 items-start"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                            {msg.sender?.avatar_url ? (
                              <img
                                src={msg.sender.avatar_url}
                                alt="Sender"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {msg.sender?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {msg.body || "Sent an attachment"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => navigate("/messages")}
                    className="w-full px-4 py-2 text-sm text-center text-blue-600 hover:bg-gray-50 font-medium border-t border-gray-100"
                  >
                    View all messages
                  </button>
                </div>
              </div>
            )}

            {user ? (
              <div className="group h-full flex items-center relative cursor-pointer">
                <div className="flex items-center gap-3">
                  {/* Avatar with Role Glow */}
                  <div
                    className={`relative w-10 h-10 rounded-full p-[2px] ${
                      user.role === "SELLER"
                        ? "bg-gradient-to-tr from-orange-400 to-pink-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        : user.role === "AGENT"
                        ? "bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "bg-gradient-to-tr from-blue-400 to-cyan-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-gray-500 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className={`font-medium transition flex items-center gap-1 ${transparent ? 'text-white' : 'text-gray-800 hover:text-blue-600'}`}>
                      Hi, {user.name.split(" ")[0]}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        user.role === "SELLER"
                          ? "text-orange-500"
                          : user.role === "AGENT"
                          ? "text-emerald-500"
                          : "text-blue-500"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="absolute top-16 right-0 w-48 bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-lg py-2">
                  <button
                    onClick={() => navigate("/profile")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Profile & Settings
                  </button>
                  {(user.role === "SELLER" || user.role === "AGENT" || user.role === "PENDING_AGENT" || user.role === "REJECTED_AGENT") && (
                    <button
                      onClick={() => navigate(user.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard")}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-700 font-bold hover:bg-blue-50"
                    >
                      Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/favorites")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    My Favorites
                  </button>
                  <button
                    onClick={() => navigate("/messages")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Messages
                  </button>
                  {user.role === "SELLER" && (
                    <button
                      onClick={() => navigate("/my-properties")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >
                      My Properties
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-5 py-2 rounded-lg transition duration-300 font-medium"
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
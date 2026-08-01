/**
 * @file Home.jsx
 * @description Main landing page displaying a searchable list of properties.
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/UserAuthContext";
import { motion } from "framer-motion";
import { Search, Home as HomeIcon, Key, MapPin } from "lucide-react";
import "./Home.css";

const Home = () => {
  // Component State
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch property data on component mount or page change
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/properties?page=${page}&limit=12`,
        );
        if (page === 1) {
          setProperties(response.data.properties);
        } else {
          setProperties((prev) => [...prev, ...response.data.properties]);
        }
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };
    fetchProperties();
  }, [page]);

  const handleMessageSeller = async (propertyId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "BUYER") {
      navigate("/messages");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/conversations/property/${propertyId}`,
      );
      navigate(`/messages?conversation=${response.data.conversation.id}`);
    } catch (error) {
      console.error(
        "Error starting conversation:",
        error.response?.data || error.message,
      );
    }
  };

  /**
   * Filter logic to display properties matching the user's search input.
   * Matches against both the title and the description fields.
   */
  const filteredProperties = properties.filter((prop) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (prop.title && prop.title.toLowerCase().includes(searchLower)) ||
      (prop.description &&
        prop.description.toLowerCase().includes(searchLower)) ||
      (prop.address && prop.address.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="home-page min-h-screen bg-[#191918] text-white font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden min-h-[720px] flex items-center">
        <div className="absolute inset-0 bg-[#191918]" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[#f47b20] text-xs uppercase tracking-[4px] mb-6">
                Luxury real estate
              </p>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight">
                Discover your
                <br />
                <span className="text-[#f47b20]">ideal</span>
                <br />
                living space.
              </h1>

              <p className="text-gray-400 max-w-lg mt-8 leading-relaxed">
                Discover exceptional homes, premium land and rental properties
                designed for comfort, elegance and modern living.
              </p>

              <div className="mt-10">
                <div className="flex items-center bg-[#252524] border border-gray-700 rounded-full p-2 max-w-xl">
                  <Search className="ml-4 text-gray-500 w-5 h-5" />

                  <input
                    type="text"
                    placeholder="Search location, city or property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-gray-500"
                  />

                  <button className="bg-[#f47b20] hover:bg-[#ff8d35] text-black font-bold px-7 py-3 rounded-full transition">
                    Search
                  </button>
                </div>
              </div>
            </motion.div>

            {/* RIGHT IMAGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#f47b20]/20 blur-[100px]" />

              <img
                src="/back-image.png"
                alt="Luxury modern house"
                className="relative w-full rounded-3xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="bg-[#191918] py-24">
        {/* --- Premium Features Section --- */}
        {!searchTerm && (
          <div className=" py-20 relative z-20 mt-[-40px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl font-extrabold text-white-900 mb-12"
              >
                See how Thirasara can help
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Sell a property",
                    desc: "No matter what path you take to sell your property, we can help you navigate a successful sale.",
                    icon: Key,
                    action: "See your options",
                    link: user?.role === "SELLER" ? "/add-property" : "/login",
                  },
                  {
                    title: "Buy a home",
                    desc: "Find your place with an immersive photo experience and the most listings.",
                    icon: HomeIcon,
                    action: "Browse homes",
                    link: "/map",
                  },
                  {
                    title: "Rent a home",
                    desc: "We are creating a seamless online experience from shopping to applying.",
                    icon: MapPin,
                    action: "Find rentals",
                    link: "/map",
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.2 }}
                    whileHover={{ y: -8 }}
                    className="bg-[#5e5e5d] rounded-3xl shadow-sm hover:shadow-xl  p-10 flex flex-col items-center transition-all duration-300 group cursor-pointer"
                    onClick={() => navigate(feature.link)}
                  >
                    <div className="w-20 h-20 bg-[#5e5e5d] rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                      <feature.icon className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-white-600 text-base mb-8 flex-grow leading-relaxed">
                      {feature.desc}
                    </p>
                    <button className="text-blue-600 font-bold border-2 border-blue-600 rounded-full px-8 py-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 w-full md:w-auto shadow-sm">
                      {feature.action}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ORANGE MARQUEE */}
      <div className="bg-[#f47b20] text-black py-4 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex gap-10 text-sm font-black uppercase">
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
        </div>
      </div>

      {/* FEATURED PROPERTIES */}
      <section className="py-24 bg-[#191918]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[#f47b20] text-xs uppercase tracking-[3px] mb-4">
                Featured properties
              </p>

              <h2 className="text-4xl md:text-6xl font-bold uppercase">
                Designed for
                <br />
                your future
              </h2>
            </div>

            <p className="hidden md:block text-gray-500 max-w-xs">
              Explore our handpicked collection of premium properties.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {filteredProperties.map((prop, idx) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: (idx % 3) * 0.1,
                }}
                className=" bg-[#1f1f1e] rounded-2xl overflow-hidden"
              >
                <PropertyCard
                  prop={prop}
                  handleMessageSeller={handleMessageSeller}
                />
              </motion.div>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-32">
              <Search className="w-14 h-14 mx-auto text-gray-600 mb-5" />

              <h3 className="text-2xl font-bold">No properties found</h3>

              <p className="text-gray-500 mt-3">
                Try another location or property.
              </p>
            </div>
          )}

          {page < totalPages && filteredProperties.length > 0 && (
            <div className="text-center mt-14">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-[#5e5e5d] text-black px-8 py-4 rounded-full font-bold hover:bg-[#5e5e5d] transition"
              >
                Load More Properties
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECOND ORANGE BAR */}
      <div className="bg-[#f47b20] text-black py-4 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex gap-10 text-sm font-black uppercase">
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
          <span> Thirasara Property ✦</span>
        </div>
      </div>

      {/* FAQ */}
      <section className="py-24 bg-[#191918]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[#f47b20] text-xs uppercase tracking-[3px] mb-4">
                FAQ
              </p>

              <h2 className="text-4xl md:text-6xl font-bold uppercase">
                Frequently
                <br />
                asked questions
              </h2>

              <img
                src="/background.png"
                alt="Luxury modern house"
                className="relative w-full rounded-3xl object-cover"
              />
            </div>

            <div className="space-y-3">
              {[
                "What makes your properties different?",
                "Can I schedule a property viewing?",
                "How long does it take to close?",
                "How do I find the right property?",
              ].map((question, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-[#242423] px-6 py-5 rounded-xl cursor-pointer hover:bg-[#2c2c2b] transition"
                >
                  <span className="font-semibold">{question}</span>

                  <span className="text-[#f47b20] text-xl">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

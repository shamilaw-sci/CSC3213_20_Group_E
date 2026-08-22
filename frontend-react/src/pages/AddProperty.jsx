import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Compass, 
  Palmtree, 
  ShieldCheck, 
  Home, 
  DollarSign, 
  Bed, 
  Bath, 
  Maximize2, 
  Phone, 
  Crosshair, 
  Trash2, 
  Upload,
  AlertCircle,
  Lock,
  Edit3,
  CreditCard,
  Check
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import imageCompression from "browser-image-compression";

import { useAuth } from "../context/UserAuthContext";
import Navbar from "../components/layout/Navbar";
import usePropertyForm from "../hooks/usePropertyForm";

// Custom Leaflet marker icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Sri Lankan Districts
const sriLankaDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle"
];

// District Lat/Lng Coordinates
const districtLocations = {
  Colombo: [6.9271, 79.8612],
  Gampaha: [7.0917, 79.9992],
  Kalutara: [6.5854, 79.9607],
  Kandy: [7.2906, 80.6337],
  Galle: [6.0535, 80.221],
  Matara: [5.9549, 80.555],
  Hambantota: [6.1246, 81.1185],
  Jaffna: [9.6615, 80.0255],
  Kurunegala: [7.4818, 80.3609],
  Ratnapura: [6.7056, 80.3847],
  Anuradhapura: [8.3114, 80.4037],
  Polonnaruwa: [7.9403, 81.0188],
  Matale: [7.4675, 80.6234],
  "Nuwara Eliya": [6.9497, 80.7891],
  Badulla: [6.9895, 81.0557],
  Trincomalee: [8.5874, 81.2152],
  Batticaloa: [7.7310, 81.6747],
  Ampara: [7.2975, 81.6747],
  Puttalam: [8.0408, 79.8394],
  Kegalle: [7.2513, 80.3464],
  Monaragala: [6.8728, 81.3507],
  Mannar: [8.9810, 79.9042],
  Vavuniya: [8.7542, 80.4982],
  Kilinochchi: [9.3803, 80.3770],
  Mullaitivu: [9.2671, 80.8142]
};

const STEPS = [
  { id: 1, title: "Category & Price", icon: Home, subtitle: "Type & pricing" },
  { id: 2, title: "Spatial Location", icon: MapPin, subtitle: "District & map pin" },
  { id: 3, title: "Specs & Photos", icon: ImageIcon, subtitle: "Details & HD images" },
  { id: 4, title: "Review & Publish", icon: CheckCircle2, subtitle: "Verify & payment" },
];

const formatLKRPreview = (num, period) => {
  if (!num || isNaN(num)) return null;
  const n = Number(num);
  let base = "";
  if (n >= 1000000000) base = `Rs. ${(n / 1000000000).toFixed(2)} Billion`;
  else if (n >= 1000000) base = `Rs. ${(n / 1000000).toFixed(2)} Million`;
  else if (n >= 1000) base = `Rs. ${(n / 1000).toLocaleString()} Thousand`;
  else base = `Rs. ${n.toLocaleString()}`;

  return period ? `${base} / ${period}` : base;
};

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsActive, setGpsActive] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const {
    formData,
    setFormData,
    handleChange,
    locationMode,
    setLocationMode,
    boundaryCoordinates,
    setBoundaryCoordinates,
    images,
    setImages,
    previewUrls,
    setPreviewUrls,
    loading,
    message,
    setMessage,
    handleSubmit,
    paymentConfig,
  } = usePropertyForm();

  // Handle Type Change with exact conditional rules
  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      listingType: (type === "Rent House" || type === "Rent Villa") ? "Rent" : "Sale",
      bedrooms: type === "Land" ? "" : prev.bedrooms,
      bathrooms: type === "Land" ? "" : prev.bathrooms,
      houseSize: (type === "Land") ? "" : prev.houseSize,
      landSize: (type === "Rent House" || type === "Rent Villa") ? "" : prev.landSize,
      pricePeriod: (type === "Rent House" || type === "Rent Villa") ? (prev.pricePeriod || "Month") : "",
    }));
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    const coords = districtLocations[district] || [7.8731, 80.7718];
    setFormData((prev) => ({
      ...prev,
      district,
      latitude: coords[0],
      longitude: coords[1],
    }));
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setGpsActive(true);
        setLocationMode("point");
        setBoundaryCoordinates([]);
      },
      () => {
        alert("Unable to retrieve GPS coordinates. Please select on map.");
        setGpsActive(false);
      }
    );
  };

  const MapClickEvents = () => {
    useMapEvents({
      click(e) {
        if (locationMode === "point") {
          setFormData((prev) => ({
            ...prev,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          }));
          setGpsActive(false);
        } else if (locationMode === "boundary") {
          setBoundaryCoordinates((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
        }
      },
    });
    return null;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) {
      setMessage({ type: "error", text: "You can upload up to 8 high-definition photos." });
      return;
    }
    setCompressing(true);
    const options = { maxSizeMB: 1.2, maxWidthOrHeight: 1920, useWebWorker: true };
    try {
      const compressed = await Promise.all(
        files.map(async (file) => {
          const comp = await imageCompression(file, options);
          return { file: comp, url: URL.createObjectURL(comp) };
        })
      );
      setImages((prev) => [...prev, ...compressed.map((c) => c.file)]);
      setPreviewUrls((prev) => [...prev, ...compressed.map((c) => c.url)]);
    } catch {
      setMessage({ type: "error", text: "Failed to process some images." });
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.title.trim()) {
        setMessage({ type: "error", text: "Please enter a descriptive property title." });
        return false;
      }
      if (!formData.price || Number(formData.price) <= 0) {
        setMessage({ type: "error", text: "Please provide a valid asking price." });
        return false;
      }
      if (!formData.district) {
        setMessage({ type: "error", text: "Please select the property district." });
        return false;
      }
    } else if (step === 2) {
      if (!formData.city?.trim() && !formData.address?.trim()) {
        setMessage({ type: "error", text: "Please specify the town or street address." });
        return false;
      }
      if (locationMode === "boundary" && boundaryCoordinates.length < 3) {
        setMessage({ type: "error", text: "Please click at least 3 points on the map to define the boundary." });
        return false;
      }
    } else if (step === 3) {
      if (images.length === 0) {
        setMessage({ type: "error", text: "Please upload at least 1 photograph of your property." });
        return false;
      }
    }
    setMessage({ type: "", text: "" });
    return true;
  };

  const nextStep = (e) => {
    if (e) e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = (e) => {
    if (e) e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isRentType = formData.type === "Rent House" || formData.type === "Rent Villa";
  const isLandType = formData.type === "Land";
  const isHouseType = formData.type === "House";

  const getTitlePlaceholder = () => {
    if (isHouseType) return "e.g. Beautiful 2-Story House in Colombo 07";
    if (isLandType) return "e.g. 15 Perch Prime Land in Malabe";
    if (formData.type === "Rent House") return "e.g. Fully Furnished 3 Bedroom House for Rent in Kandy";
    if (formData.type === "Rent Villa") return "e.g. Luxury Private Pool Villa in Galle Fort for Rent";
    return "Enter Property Title";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create New Property Listing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Guided 4-step spatial listing publisher with official deed moderation
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Official Seller Studio</span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (s.id < currentStep || validateStep(currentStep)) {
                      goToStep(s.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : isPast
                      ? "bg-slate-800/80 text-emerald-400 hover:bg-slate-800"
                      : "bg-slate-950/40 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isActive ? "bg-white text-blue-900" : isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    {isPast ? "✓" : s.id}
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-300"}`}>
                      {s.title}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium truncate">
                      {s.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Global Feedback Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg ${
              message.type === "success"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                : "bg-red-950/60 text-red-300 border border-red-500/40"
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* ════════════════════════════════════════════════════════════
              STEP 1: CATEGORY & BASIC INFO
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Select Property Asset Class <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "House", title: "Residential House", icon: Home, desc: "Single/multi-family homes for sale" },
                    { id: "Land", title: "Land Only", icon: Crosshair, desc: "Bare land, agricultural & estates" },
                    { id: "Rent House", title: "Rent House", icon: Building2, desc: "Houses available for lease" },
                    { id: "Rent Villa", title: "Rent Villa", icon: Palmtree, desc: "Boutique villas & holiday rentals" },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.type === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleTypeSelect(cat.id)}
                        className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? "border-blue-500 bg-blue-600/15 text-white shadow-lg shadow-blue-500/15"
                            : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{cat.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Property Headline Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={getTitlePlaceholder()}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Include district, bedrooms, and signature amenities for highest buyer visibility.
                </span>
              </div>

              {/* Price & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Price (Rs.) <span className="text-blue-400">*</span>
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <DollarSign className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Enter Price"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                      />
                    </div>

                    {isRentType && (
                      <select
                        name="pricePeriod"
                        value={formData.pricePeriod || "Month"}
                        onChange={handleChange}
                        className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer font-bold shrink-0"
                      >
                        <option value="Month">/ Month</option>
                        <option value="Year">/ Year</option>
                      </select>
                    )}
                  </div>

                  {formData.price && (
                    <span className="text-xs font-bold text-emerald-400 mt-1.5 block">
                      Preview: {formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    District <span className="text-blue-400">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select District</option>
                    {sriLankaDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Phone & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Contact Number (WhatsApp / Call) <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="e.g. 0771234567"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Listing Type
                  </label>
                  <div className="px-4 py-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-sm font-bold text-slate-300">
                    {isRentType ? "For Lease / Rental" : "For Sale / Outright Purchase"}
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-end border-t border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Spatial Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </m.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 2: SPATIAL LOCATION & POSTGIS MAP
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Nearby Town / City <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Kadawatha, Colombo 07, Kandy Town"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123, Main Road, Kadawatha"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Geospatial Mapping Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("point");
                        setBoundaryCoordinates([]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "point"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Single Pin Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationMode("boundary")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "boundary"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Draw Boundary Polygon
                    </button>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        gpsActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>My GPS</span>
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-700 relative shadow-inner">
                  <MapContainer
                    center={[formData.latitude || 6.9271, formData.longitude || 79.8612]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickEvents />

                    {locationMode === "point" && formData.latitude && formData.longitude && (
                      <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />
                    )}

                    {locationMode === "boundary" && (
                      <>
                        {boundaryCoordinates.map((c, i) => (
                          <CircleMarker key={i} center={c} radius={6} color="#3b82f6" fillColor="#60a5fa" fillOpacity={0.8} />
                        ))}
                        {boundaryCoordinates.length >= 3 && (
                          <Polygon positions={boundaryCoordinates} color="#2563eb" fillColor="#3b82f6" fillOpacity={0.4} />
                        )}
                      </>
                    )}
                  </MapContainer>

                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 font-semibold z-[1000]">
                    {locationMode === "point"
                      ? "📍 Click anywhere on map to position property pin"
                      : `📐 Click to add boundary points (${boundaryCoordinates.length} selected)`}
                  </div>

                  {locationMode === "boundary" && boundaryCoordinates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBoundaryCoordinates([])}
                      className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold z-[1000] shadow-md cursor-pointer"
                    >
                      Clear Boundary
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Specs & Photos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </m.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 3: SPECIFICATIONS & HD PHOTOGRAPHY
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {!isLandType && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Bedrooms
                    </label>
                    <div className="relative">
                      <Bed className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleChange}
                        placeholder="e.g. 3"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Bathrooms
                    </label>
                    <div className="relative">
                      <Bath className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleChange}
                        placeholder="e.g. 2"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLandType && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    House Size (sqft)
                  </label>
                  <div className="relative">
                    <Maximize2 className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      name="houseSize"
                      value={formData.houseSize}
                      onChange={handleChange}
                      placeholder="e.g. 1800"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(isLandType || isHouseType) && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Land Size (Perches)
                  </label>
                  <input
                    type="number"
                    name="landSize"
                    value={formData.landSize}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the key features of your property..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  High-Definition Photographs ({images.length}/8) <span className="text-blue-400">*</span>
                </label>
                
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center bg-slate-950/40 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="property-photos-input"
                    className="hidden"
                  />
                  <label htmlFor="property-photos-input" className="flex flex-col items-center cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white">Click to Upload HD Photographs</span>
                    <span className="text-xs text-slate-400 mt-1">Automatic browser compression up to 1920px (Max 8 photos)</span>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Review Property Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </m.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 4: COMPLETE EXECUTIVE REVIEW & VERIFICATION HUB
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black uppercase">
                    Final Step 4 of 4
                  </span>
                  <h3 className="text-xl font-black text-white">Review & Confirm Your Listing</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Please verify all details carefully. You can edit any section before proceeding to payment.
                </p>
              </div>

              {/* Summary Cards Grid with Direct Edit Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Category & Price Summary */}
                <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">1. Category & Price</span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Type:</span>
                        <strong className="text-white text-sm">{formData.type} ({formData.listingType})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Price:</span>
                        <strong className="text-emerald-400 text-sm">{formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Contact Phone:</span>
                        <span className="text-slate-200">{formData.contactNumber || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Spatial Location Summary */}
                <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">2. Spatial Location</span>
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">District:</span>
                        <strong className="text-white">{formData.district}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Town / Address:</span>
                        <span className="text-slate-200">{formData.city || formData.address || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Mapping Coordinates:</span>
                        <span className="text-blue-400 font-mono text-[11px]">
                          {locationMode === "boundary" ? `Polygon (${boundaryCoordinates.length} vertices)` : `${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Specs & Media Summary */}
                <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">3. Specs & Photos</span>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {!isLandType && (
                        <div>
                          <span className="text-slate-400 block">Bedrooms / Baths:</span>
                          <span className="text-slate-200">{formData.bedrooms || 0} Beds · {formData.bathrooms || 0} Baths</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block">Size:</span>
                        <span className="text-slate-200">{formData.landSize ? `${formData.landSize} Perches` : ""}{formData.houseSize ? ` · ${formData.houseSize} sqft` : ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Photographs:</span>
                        <span className="text-emerald-400 font-bold">{images.length} Photos Attached</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Buyer Card Preview */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Live Showcase Card (As Viewed by Buyers on Live Map)
                </h4>
                <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden max-w-md mx-auto shadow-2xl">
                  <div className="aspect-video w-full bg-slate-800 relative">
                    {previewUrls[0] ? (
                      <img src={previewUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                        No Photo Uploaded
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase">
                      {formData.type}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xl font-black text-white drop-shadow-md">
                        {formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null) || `Rs. ${formData.price}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="font-bold text-white text-base line-clamp-1">{formData.title || "Property Title"}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{formData.city ? `${formData.city}, ${formData.district}` : formData.district}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 font-semibold">
                      {formData.bedrooms && <span>🛏️ {formData.bedrooms} Beds</span>}
                      {formData.bathrooms && <span>🚿 {formData.bathrooms} Baths</span>}
                      {formData.houseSize && <span>🏠 {formData.houseSize} sqft</span>}
                      {formData.landSize && <span>📐 {formData.landSize} Perch</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="p-6 rounded-3xl bg-emerald-950/30 border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">One-Time Activation Fee</span>
                    <h4 className="text-xl font-black text-white">
                      Rs. {parseFloat(paymentConfig.listingFee || 500).toLocaleString()} <span className="text-xs font-normal text-slate-400">LKR</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Secured via Central Bank of Sri Lanka approved PayHere Payment Gateway
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 sm:text-right">
                  <span className="block font-bold text-white">✓ Deed Verification</span>
                  <span className="block">✓ PostGIS Map Broadcast</span>
                  <span className="block">✓ Unlimited Buyer Leads</span>
                </div>
              </div>

              {/* Final Step Controls */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Specs & Photos</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading
                      ? "Processing Payment..."
                      : `Proceed to Payment (Rs. ${parseFloat(paymentConfig.listingFee || 500).toLocaleString()}) →`}
                  </span>
                </button>
              </div>

            </m.div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AddProperty;

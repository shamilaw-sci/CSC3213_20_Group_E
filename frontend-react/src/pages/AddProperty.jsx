import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Home, 
  Crosshair, 
  Trash2, 
  AlertCircle,
  Check } from "lucide-react";

import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import imageCompression from "browser-image-compression";

import { useAuth } from "../context/UserAuthContext";
import Navbar from "../components/layout/Navbar";
import { contactError, specificationError } from '../utils/propertyValidation';
import usePropertyForm from "../hooks/usePropertyForm";
import CategoryPriceStep from "../components/property/create/CategoryPriceStep";
import LocationStep from "../components/property/create/LocationStep";
import PropertySpecificationFields from "../components/property/create/PropertySpecificationFields";
import HDPhotosSection from "../components/property/create/HDPhotosSection";
import VirtualToursSection from "../components/property/create/VirtualToursSection";
import ReviewPublishStep from "../components/property/create/ReviewPublishStep";

const MapRecenter = ({ request, appliedRequestRef }) => {
  const map = useMap();
  React.useEffect(() => {
    if (request && appliedRequestRef.current !== request) {
      map.setView(request.coords, 14);
      appliedRequestRef.current = request;
    }
  }, [map, request, appliedRequestRef]);
  return null;
};
const MapClickEvents = ({ locationMode, setFormData, setGpsActive, setBoundaryCoordinates }) => {
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
  const [mapRequest, setMapRequest] = useState(null);
  const uploadRevision = React.useRef(0);
  const appliedMapRequestRef = React.useRef(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [, setCompressing] = useState(false);

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
    virtualTourFiles,
    setVirtualTourFiles,
    virtualTourMetadata,
    setVirtualTourMetadata,
    loading,
    message,
    setMessage,
    handleSubmit,
    paymentConfig,
    paymentAmount,
    retryPaymentConfig,
  } = usePropertyForm();

  const MAX_HD_MB = 50; 
  const currentHDSizeMB = images.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
  const hdProgress = Math.min((currentHDSizeMB / MAX_HD_MB) * 100, 100);

  const MAX_360_MB = 25; 
  const current360SizeMB = virtualTourFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
  const v360Progress = Math.min((current360SizeMB / MAX_360_MB) * 100, 100);


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
    setGpsActive(false);
    setMapRequest({ coords });
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
        setMapRequest({ coords: [pos.coords.latitude, pos.coords.longitude] });
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

  const handleVirtualTourUpload = (e) => {
    const revision = ++uploadRevision.current;
    const files = Array.from(e.target.files);

      // Prevent individual files from exceeding the 5MB backend limit
      const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
      if (oversized.length > 0) {
        setMessage({ source: "upload", revision, type: "error", text: "Upload failed: One or more 360 panorama files exceed the 5MB limit." });
        return;
      }

    if (files.length + virtualTourFiles.length > 5) {
      setMessage({ source: 'upload', revision, type: 'error', text: 'You can only upload up to 5 virtual tours.' });
      return;
    }
    if (files.length) setMessage(previous => previous.source === 'upload' && previous.revision <= revision ? { type: '', text: '' } : previous);
    setVirtualTourFiles((prev) => [...prev, ...files]);
    const newMetadata = files.map(() => ({ room: 'Room' }));
    setVirtualTourMetadata((prev) => [...prev, ...newMetadata]);
  };

  const handleVirtualTourLabel = (index, value) => {
    setVirtualTourMetadata((prev) => {
      const newMeta = [...prev];
      newMeta[index] = { ...newMeta[index], room: value };
      return newMeta;
    });
  };

  const removeVirtualTour = (index) => {
    setVirtualTourFiles((prev) => prev.filter((_, i) => i !== index));
    setVirtualTourMetadata((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e) => {
    const initialMessage = message;
    const revision = ++uploadRevision.current;
    const files = Array.from(e.target.files);

      // Prevent individual files from exceeding the 5MB backend limit
      const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
      if (oversized.length > 0) {
        setMessage({ source: "upload", revision, type: "error", text: "Upload failed: One or more files exceed the 5MB maximum size limit." });
        return;
      }

    if (images.length + files.length > 8) {
      setMessage({ source: "upload", revision, type: "error", text: "You can upload up to 8 high-definition photos." });
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
      if (files.length) setMessage(previous => previous.source === 'upload' && previous.revision <= revision ? { type: '', text: '' } : previous);
      setImages((prev) => [...prev, ...compressed.map((c) => c.file)]);
      setPreviewUrls((prev) => [...prev, ...compressed.map((c) => c.url)]);
    } catch {
      setMessage(previous => uploadRevision.current === revision && (previous === initialMessage || (previous.source === 'upload' && previous.revision <= revision))
        ? { source: 'upload', revision, type: 'error', text: 'Failed to process some images.' }
        : previous);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const previewUrlsRef = React.useRef(previewUrls);
  React.useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  React.useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount only
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
      const error = contactError(formData.contactNumber);
      if (error) { setMessage({ type: 'error', text: error }); return false; }
    } else if (step === 2) {
      if (!formData.city?.trim() && !formData.address?.trim()) {
        setMessage({ type: "error", text: "Please specify the town or street address." });
        return false;
      }
      if (locationMode === "boundary") {
        let distinctPoints = boundaryCoordinates.length;
        if (distinctPoints > 0) {
          const first = boundaryCoordinates[0];
          const last = boundaryCoordinates[boundaryCoordinates.length - 1];
          if (first[0] === last[0] && first[1] === last[1]) {
            distinctPoints -= 1;
          }
        }
        if (distinctPoints < 3) {
          setMessage({ type: "error", text: "Please click at least 3 distinct points on the map to define the boundary." });
          return false;
        }
      }
    } else if (step === 3) {
      const error = specificationError(formData);
      if (error) { setMessage({ type: 'error', text: error }); return false; }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create New Property Listing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Guided 4-step spatial listing publisher with official deed moderation
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Seller Studio</span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 mb-8 shadow-xl">
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
                      ? "bg-slate-100/80 dark:bg-slate-800/80 text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "bg-slate-50/40 dark:bg-slate-950/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isActive ? "bg-white text-blue-900" : isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {isPast ? "✓" : s.id}
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {s.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      {s.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
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
                : message.type === "info" ? "bg-blue-950/60 text-blue-300 border border-blue-500/40"
                : "bg-red-950/60 text-red-300 border border-red-500/40"
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* ════════════════════════════════════════════════════════════
              STEP 1: CATEGORY & BASIC INFO
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <CategoryPriceStep
                formData={formData}
                isRentType={isRentType}
                titlePlaceholder={getTitlePlaceholder()}
                pricePreview={formData.price && formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null)}
                districts={sriLankaDistricts}
                onChange={handleChange}
                onTypeSelect={handleTypeSelect}
                onDistrictChange={handleDistrictChange}
                onContinue={nextStep}
              />
            </m.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 2: SPATIAL LOCATION & POSTGIS MAP
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <LocationStep
                formData={formData}
                onChange={handleChange}
                locationMode={locationMode}
                onModeChange={setLocationMode}
                onBoundaryChange={setBoundaryCoordinates}
                boundaryCount={boundaryCoordinates.length}
                gpsActive={gpsActive}
                onGetGPS={handleGetGPS}
                onPrevious={prevStep}
                onContinue={nextStep}
              >
                  <MapContainer
                    center={[formData.latitude || 6.9271, formData.longitude || 79.8612]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <MapRecenter request={mapRequest} appliedRequestRef={appliedMapRequestRef} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickEvents locationMode={locationMode} setFormData={setFormData} setGpsActive={setGpsActive} setBoundaryCoordinates={setBoundaryCoordinates} />

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
              </LocationStep>
            </m.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 3: SPECIFICATIONS & HD PHOTOGRAPHY
          ════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <PropertySpecificationFields formData={formData} isLandType={isLandType} isHouseType={isHouseType} onChange={handleChange} />

              <HDPhotosSection
                imageCount={images.length}
                previewUrls={previewUrls}
                onUpload={handleImageUpload}
                onRemove={removeImage}
                currentSizeMB={currentHDSizeMB}
                maxSizeMB={MAX_HD_MB}
                progress={hdProgress}
              />

                <VirtualToursSection
                  onUpload={handleVirtualTourUpload}
                  currentSizeMB={current360SizeMB}
                  maxSizeMB={MAX_360_MB}
                  progress={v360Progress}
                >
                  {virtualTourFiles.length > 0 && (
                    <div className="space-y-4">
                      {virtualTourFiles.map((file, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-4 items-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="w-full sm:w-24 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                            <img src={URL.createObjectURL(file)} alt="360 preview" className="w-full h-full object-cover opacity-70" />
                          </div>
                          <div className="flex-grow w-full">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Room / Area Label</label>
                            <input
                              type="text"
                              value={virtualTourMetadata[index]?.room || ''}
                              onChange={(e) => handleVirtualTourLabel(index, e.target.value)}
                              placeholder="e.g. Living Room, Master Bedroom"
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVirtualTour(index)}
                            className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </VirtualToursSection>


              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
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
              <ReviewPublishStep
                formData={formData}
                isRentType={isRentType}
                isLandType={isLandType}
                images={images}
                virtualTourFiles={virtualTourFiles}
                virtualTourMetadata={virtualTourMetadata}
                previewUrls={previewUrls}
                paymentConfig={paymentConfig}
                paymentAmount={paymentAmount}
                retryPaymentConfig={retryPaymentConfig}
                loading={loading}
                goToStep={goToStep}
                handleSubmit={handleSubmit}
                formatLKRPreview={formatLKRPreview}
                locationMode={locationMode}
                boundaryCoordinates={boundaryCoordinates}
              />

            </m.div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AddProperty;

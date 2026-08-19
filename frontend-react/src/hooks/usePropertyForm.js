import { useState } from "react";
import api from "../context/api";
import { usePayhere } from "./usePayhere";

export default function usePropertyForm() {
  const [formData, setFormData] = useState({
    listingType: "Sale",
    address: "",
    type: "House",
    title: "",
    description: "",
    price: "",
    pricePeriod: "Month",
    district: "",
    city: "",
    contactNumber: "",
    bedrooms: "",
    bathrooms: "",
    landSize: "",
    houseSize: "",
    latitude: 7.8731,
    longitude: 80.7718,
  });

  const [locationMode, setLocationMode] = useState("point");
  const [boundaryCoordinates, setBoundaryCoordinates] = useState([]);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { paymentConfig, triggerPayment } = usePayhere(setMessage);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      setMessage({ type: "error", text: "Please upload at least 1 image." });
      return;
    }

    if (locationMode === "boundary" && boundaryCoordinates.length < 3) {
      setMessage({
        type: "error",
        text: "Please select at least 3 points to draw a boundary.",
      });
      return;
    }

    setLoading(true);
    setMessage({
      type: "success",
      text: "Saving property details... Please do not close this window.",
    });

    try {
      const submitData = new FormData();

      // Construct WKT String for Boundaries
      let finalBoundaryWKT = "";
      let centerLat = formData.latitude;
      let centerLng = formData.longitude;

      if (locationMode === "boundary" && boundaryCoordinates.length >= 3) {
        const coords = [...boundaryCoordinates];
        const first = coords[0];
        const last = coords[coords.length - 1];

        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push(first);
        }

        const wktPoints = coords.map((c) => `${c[1]} ${c[0]}`).join(", ");
        finalBoundaryWKT = `POLYGON((${wktPoints}))`;

        centerLat = boundaryCoordinates[0][0];
        centerLng = boundaryCoordinates[0][1];
      } else {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        const offset = 0.0001;

        finalBoundaryWKT = `POLYGON((${lng - offset} ${lat - offset}, ${
          lng + offset
        } ${lat - offset}, ${lng + offset} ${lat + offset}, ${lng - offset} ${
          lat + offset
        }, ${lng - offset} ${lat - offset}))`;
      }

      // Append standard text fields to FormData
      Object.keys(formData).forEach((key) => {
        // Handle specialized keys manually
        if (key !== 'latitude' && key !== 'longitude') {
           submitData.append(key, formData[key]);
        }
      });
      
      submitData.append("latitude", centerLat);
      submitData.append("longitude", centerLng);
      submitData.append("boundary", finalBoundaryWKT);

      images.forEach((image) => {
        submitData.append("images", image);
      });

      // 1. Dispatch API request to backend to save property
      const response = await api.post('/properties', submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newPropertyId = response.data.property.id;

      setMessage({
        type: "success",
        text: "Property saved! Initiating payment gateway...",
      });

      // 2. Trigger the PayHere payment popup
      await triggerPayment(newPropertyId);
    } catch (error) {
      console.error("Add Property Error:", error.response || error.message);
      const backendError =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Unknown Error";
      setMessage({ type: "error", text: `Failed: ${backendError}` });
      setLoading(false);
    }
  };

  return {
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
  };
};

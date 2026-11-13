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
  const [virtualTourFiles, setVirtualTourFiles] = useState([]);
  const [virtualTourMetadata, setVirtualTourMetadata] = useState([]);
  const [draftPropertyId, setDraftPropertyId] = useState(null);
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

    if (draftPropertyId) {
      setMessage({ type: "success", text: "Resuming payment for existing draft..." });
      await triggerPayment(draftPropertyId);
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
        let coords = [...boundaryCoordinates];
        let first = coords[0];
        let last = coords[coords.length - 1];

        // If the user manually closed it, remove the duplicate last point temporarily
        // so we can count the true number of distinct vertices.
        if (first[0] === last[0] && first[1] === last[1]) {
            coords.pop();
        }

        if (coords.length < 3) {
            setMessage({ type: "error", text: "A valid boundary must have at least 3 distinct points (a triangle)." });
            setLoading(false);
            return;
        }

        // Always push the exact first point at the very end to guarantee a perfectly closed PostGIS polygon
        first = coords[0];
        coords.push(first);

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

      virtualTourFiles.forEach((file) => {
        submitData.append("virtualTours", file);
      });

      if (virtualTourMetadata.length > 0) {
        submitData.append("virtualTourMetadata", JSON.stringify(virtualTourMetadata));
      }

      // 1. Dispatch API request to backend to save property
      const response = await api.post('/properties', submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newPropertyId = response.data.property.id;
      setDraftPropertyId(newPropertyId);

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
    virtualTourFiles,
    setVirtualTourFiles,
    virtualTourMetadata,
    setVirtualTourMetadata,
    loading,
    message,
    setMessage,
    handleSubmit,
    paymentConfig,
  };
};

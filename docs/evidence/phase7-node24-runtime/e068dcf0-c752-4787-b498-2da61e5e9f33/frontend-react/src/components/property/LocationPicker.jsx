import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet custom icon definition
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Internal component to handle leaflet map clicks
const LocationMarker = ({ formData, setFormData, boundaryCoordinates, setBoundaryCoordinates, locationMode }) => {
  useMapEvents({
    click(e) {
      if (locationMode === "point") {
        setFormData({
          ...formData,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      } else {
        setBoundaryCoordinates([
          ...boundaryCoordinates,
          [e.latlng.lat, e.latlng.lng],
        ]);
      }
    },
  });

  return (
    <>
      {locationMode === "point" && formData.latitude !== null && (
        <Marker
          position={[formData.latitude, formData.longitude]}
          icon={customIcon}
        />
      )}

      {boundaryCoordinates.length > 0 && (
        <Polygon
          positions={boundaryCoordinates}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.3 }}
        />
      )}

      {locationMode === "boundary" &&
        boundaryCoordinates.map((pos, idx) => (
          <CircleMarker
            key={idx}
            center={pos}
            radius={5}
            pathOptions={{ color: "red", fillColor: "red", fillOpacity: 1 }}
          />
        ))}
    </>
  );
};


/**
 * LocationPicker Component
 * Handles exact point placement (Drop Pin or GPS) and land boundary drawing.
 */
const LocationPicker = ({
  formData,
  setFormData,
  boundaryCoordinates,
  setBoundaryCoordinates,
  locationMode,
  setLocationMode,
}) => {
  const [gpsActive, setGpsActive] = useState(false);

  // Function to get real-time GPS location
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });

        setGpsActive(true);
        setLocationMode("point");
        setBoundaryCoordinates([]);
      },
      () => {
        alert("Unable to retrieve your location.");
        setGpsActive(false);
      }
    );
  };

  return (
    <>
      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
        Location on Map <span className="text-red-500">*</span>
      </h3>
      
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => {
            setLocationMode("point");
            setBoundaryCoordinates([]);
            setGpsActive(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            locationMode === "point" && !gpsActive
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📍 Drop Pin (Single Point)
        </button>

        <button
          type="button"
          onClick={handleGetGPSLocation}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            gpsActive
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🎯 Get GPS Location
        </button>
        <button
          type="button"
          onClick={() => {
            setLocationMode("boundary");
            setGpsActive(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            locationMode === "boundary"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ✏️ Draw Boundary (Land Area)
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {locationMode === "point"
          ? "Click anywhere on the map to place a pin on your property."
          : "Click multiple points on the map to draw the exact boundaries of your land."}
      </p>

      <div
        className="mb-4 border border-gray-300 rounded-lg overflow-hidden relative z-0 shadow-sm"
        style={{ height: "400px" }}
      >
        <MapContainer
          center={[formData.latitude, formData.longitude]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker formData={formData} setFormData={setFormData} boundaryCoordinates={boundaryCoordinates} setBoundaryCoordinates={setBoundaryCoordinates} locationMode={locationMode} />
        </MapContainer>
      </div>

      {locationMode === "boundary" && (
        <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <span className="text-sm text-blue-800 font-medium">
            Points selected: {boundaryCoordinates.length}
          </span>
          <button
            type="button"
            onClick={() => setBoundaryCoordinates([])}
            className="text-sm text-red-600 font-bold hover:text-red-800"
          >
            Clear Boundary
          </button>
        </div>
      )}

      {locationMode === "point" && (
        <div className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700">
            <span className="font-bold">Latitude:</span>{" "}
            {formData.latitude.toFixed(6)}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-bold">Longitude:</span>{" "}
            {formData.longitude.toFixed(6)}
          </div>
        </div>
      )}
    </>
  );
};

export default LocationPicker;

/**
 * @file AddProperty.jsx
 * @description Form component allowing sellers to add new property listings, including map boundary selection, image uploads, and PayHere payment integration.
 */

import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/property/ImageUploader";
import PropertyBasicInfo from "../components/property/PropertyBasicInfo";
import LocationPicker from "../components/property/LocationPicker";
import { useAuth } from "../context/UserAuthContext";
import Navbar from "../components/layout/Navbar";
import usePropertyForm from "../hooks/usePropertyForm";
import { Button } from "../components/ui/button";
import "./AddProperty.css";

const AddProperty = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans pb-12 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="from_backgroung dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="p-8">
            <PropertyBasicInfo 
              formData={formData} 
              setFormData={setFormData} 
              handleChange={handleChange} 
            />

            <LocationPicker 
              formData={formData}
              setFormData={setFormData}
              boundaryCoordinates={boundaryCoordinates}
              setBoundaryCoordinates={setBoundaryCoordinates}
              locationMode={locationMode}
              setLocationMode={setLocationMode}
            />

            <ImageUploader 
              images={images} 
              setImages={setImages} 
              previewUrls={previewUrls} 
              setPreviewUrls={setPreviewUrls} 
              setMessage={setMessage} 
            />

            <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate("/")}
                className="mr-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : `Pay Rs. ${parseFloat(
                      paymentConfig.listingFee
                    ).toLocaleString()} & Publish`}
              </Button>
            </div>

            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                }`}
              >
                {message.text}
              </div>
            )}
          </form>

          <div className="bg-blue-600 dark:bg-blue-800 px-8 py-10 text-black dark:text-white">
            <h2 className="text-3xl font-bold mb-2 align-center">
              Post a Property for Sale
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;

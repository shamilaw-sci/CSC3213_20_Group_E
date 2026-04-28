import React, { useState } from "react";
import "./Propaty.css";
import logoImage from "../assets/logo.jpeg";
import HouseForm from "./HouseForm";
import LandForm from "./LandForm";
import MediaLocationForm from "./MediaLocationForm";
import ReviewAndPay from "./ReviewAndPay";
import PostSuccess from "./PostSuccess";

const Proaty = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState("");

  // Shared State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [landSize, setLandSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("perches");

  // Land specific state
  const [landType, setLandType] = useState("agricultural");
  const [priceUnit, setPriceUnit] = useState("total"); // Added this missing state

  // House specific state
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [houseSize, setHouseSize] = useState("");

  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      alert("Maximum 5 images allowed.");
      return;
    }
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleDropPin = () => {
    setLocation({ lat: 6.9271, lng: 79.8612 });
  };

  // Calculation for Land
  let calculatedTotal = null;
  if (priceUnit === "perches" && landSize && price && category === "land") {
    calculatedTotal = parseFloat(landSize) * parseFloat(price);
  }

  return (
    <div className="app-container">
      {/* header bar */}
      <div className="header">
        {/* 2. ADD THIS CLOSE BUTTON HERE */}
        <button className="proaty-close-btn" onClick={onClose}>
          ✖
        </button>

        <div className="brand">
          <img
            src={logoImage}
            alt="Thirasara Property Logo"
            className="brand-logo"
          />
          <h1>Thirasara Property</h1>
        </div>

        <h2 className="header-title">Fill in the details</h2>
      </div>

      {/*add propaty filing details */}
      <div className="page-content">
        {/* DYNAMIC PROGRESS STEPPER */}
        <div className="stepper-container">
          <div className="stepper-line"></div>

          {/* Step 1 */}
          <div
            className={`step ${currentStep > 1 ? "completed" : ""} ${
              currentStep === 1 ? "active" : ""
            }`}
          >
            <div className="step-circle">🏠</div>
            <span className="step-label">Property Type</span>
          </div>

          {/* Step 2 */}
          <div
            className={`step ${currentStep > 2 ? "completed" : ""} ${
              currentStep === 2 ? "active" : ""
            }`}
          >
            <div className="step-circle">📍</div>
            <span className="step-label">Photos & Location</span>
          </div>

          {/* Step 3 */}
          <div
            className={`step ${currentStep > 3 ? "completed" : ""} ${
              currentStep === 3 ? "active" : ""
            }`}
          >
            <div className="step-circle">📝</div>
            <span className="step-label">Ad Details</span>
          </div>

          {/* Step 4 */}
          <div
            className={`step ${currentStep > 4 ? "completed" : ""} ${
              currentStep === 4 ? "active" : ""
            }`}
          >
            <div className="step-circle">💳</div>
            <span className="step-label">Review & Pay</span>
          </div>

          {/* Step 5 */}
          <div className={`step ${currentStep === 5 ? "active" : ""}`}>
            <div className="step-circle">🚀</div>
            <span className="step-label">Post Ad</span>
          </div>
        </div>

        <div className="panel-card">
          {/* --- STEP 1 CONTENT --- */}
          {currentStep === 1 && (
            <div className="step-content">
              <h3 className="panel-title">Step 1: Property Type</h3>
              {/* Property Categories */}
              <div className="section-container">
                <h4 className="section-subtitle">Property Categories</h4>
                <div className="category-buttons">
                  <button
                    onClick={() => setCategory("land")}
                    className={`category-btn ${
                      category === "land" ? "active" : ""
                    }`}
                  >
                    <span className="icon">🏞️</span> Land For Sale
                  </button>

                  <button
                    onClick={() => setCategory("house")}
                    className={`category-btn ${
                      category === "house" ? "active" : ""
                    }`}
                  >
                    <span className="icon">🏠</span> House For Sale
                  </button>
                </div>
              </div>
              {/* Your Step 1 form inputs go here */}
            </div>
          )}

          {/* --- STEP 2 CONTENT --- */}
          {currentStep === 2 && (
            <MediaLocationForm
              photos={photos}
              handleFileUpload={handleFileUpload}
              location={location}
              setLocation={setLocation}
            />
          )}

          {/* --- STEP 3 --- */}
          {currentStep === 3 && (
            <div className="step-content">
              <h3 className="panel-title">Step 3: Ad Details</h3>

              {category === "land" ? (
                <LandForm
                  title={title}
                  setTitle={setTitle}
                  landType={landType}
                  setLandType={setLandType}
                  landSize={landSize}
                  setLandSize={setLandSize}
                  sizeUnit={sizeUnit}
                  setSizeUnit={setSizeUnit}
                  price={price}
                  setPrice={setPrice}
                  priceUnit={priceUnit}
                  setPriceUnit={setPriceUnit}
                  calculatedTotal={calculatedTotal}
                  contactNumber={contactNumber}
                  setContactNumber={setContactNumber}
                  description={description}
                  setDescription={setDescription}
                />
              ) : (
                <HouseForm
                  title={title}
                  setTitle={setTitle}
                  bedrooms={bedrooms}
                  setBedrooms={setBedrooms}
                  bathrooms={bathrooms}
                  setBathrooms={setBathrooms}
                  houseSize={houseSize}
                  setHouseSize={setHouseSize}
                  landSize={landSize}
                  setLandSize={setLandSize}
                  sizeUnit={sizeUnit}
                  setSizeUnit={setSizeUnit}
                  price={price}
                  setPrice={setPrice}
                  contactNumber={contactNumber}
                  setContactNumber={setContactNumber}
                  description={description}
                  setDescription={setDescription}
                />
              )}
            </div>
          )}

          {currentStep === 4 && (
            <ReviewAndPay
              category={category}
              formData={{
                title,
                price,
                landSize,
                sizeUnit,
                houseSize,
                contactNumber,
              }}
            />
          )}

          {/* --- STEP 5 CONTENT --- */}
          {currentStep === 5 && (
            <PostSuccess
              category={category}
              photos={photos}
              location={location}
              formData={{
                title,
                price,
                landSize,
                sizeUnit,
                houseSize,
                contactNumber,
                description,
                bedrooms,
                bathrooms,
                landType,
              }}
            />
          )}

          {/* --- NAVIGATION BUTTONS (Next / Back) --- */}

          <div className="form-navigation">
            {
              currentStep > 1 ? (
                <button onClick={prevStep} className="btn-back">
                  Back
                </button>
              ) : (
                <div></div>
              ) /* Empty div to keep 'Next' aligned right */
            }

            {currentStep < 5 ? (
              <button onClick={nextStep} className="btn-next">
                Next Step
              </button>
            ) : (
              <button
                onClick={onClose}
                className="payhere-btn admin-submit-btn"
              >
                <span className="payhere-logo admin-icon">✓</span>
                <div className="payhere-text">Send to Admin & Finish</div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proaty;

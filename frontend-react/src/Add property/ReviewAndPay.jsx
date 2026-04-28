import React, { useState } from "react";
import "./ReviewAndPay.css";

const ReviewAndPay = ({ category, formData }) => {
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    transactionnNumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="review-container">
      <h3 className="panel-title">Step 4: Review & Bill Details</h3>

      <div className="review-grid">
        {/* Summary Section */}
        <div className="summary-section">
          <h4 className="section-subtitle">Property Summary</h4>
          <div className="summary-card">
            <p>
              <strong>Category:</strong> {category.toUpperCase()}
            </p>
            <p>
              <strong>Title:</strong> {formData.title || "N/A"}
            </p>
            <p>
              <strong>Price:</strong> Rs. {formData.price || "0"}
            </p>
            {category === "land" ? (
              <p>
                <strong>Size:</strong> {formData.landSize} {formData.sizeUnit}
              </p>
            ) : (
              <p>
                <strong>House Size:</strong> {formData.houseSize} sqft
              </p>
            )}
            <p>
              <strong>Contact:</strong> {formData.contactNumber}
            </p>
          </div>
        </div>

        {/* Billing Form Section */}
        <div className="billing-section">
          <h4 className="section-subtitle">Billing Information</h4>
          <div className="billing-form">
            <div className="form-group full-width">
              <label>Full Name for Invoice</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                placeholder="Enter your full name"
                value={billingInfo.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Transaction/Reference Number</label>
              <input
                type="text"
                name="transactionnNumber"
                className="form-control"
                placeholder="Enter the  transaction number"
                value={billingInfo.transactionnNumber}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p>paymant bank number: </p>
            </div>
          </div>
        </div>
      </div>

      <div className="total-payable">
        <span>Total Listing Fee:</span>
        <span className="amount">Rs. 2,000.00</span>
      </div>
    </div>
  );
};

export default ReviewAndPay;

import React from "react";
import "./PostSuccess.css";

const PostSuccess = ({ category, formData, photos, location }) => {
  return (
    <div className="success-container">
      <div className="success-header">
        <div className="check-icon">✓</div>
        <h3 className="panel-title">Ready to Publish</h3>
        <p>Please review your final advertisement details below.</p>
      </div>

      <div className="final-summary-grid">
        {/* Left Side: Media Preview */}
        <div className="summary-card media-summary">
          <h4>Uploaded Media</h4>
          <div className="photo-strip">
            {photos.length > 0 ? (
              photos.map((url, i) => <img key={i} src={url} alt="property" />)
            ) : (
              <p className="no-data">No photos uploaded</p>
            )}
          </div>
          <div className="location-badge">
            📍 Location: {location ? `locatin successfully` : "Not Set"}
          </div>
        </div>

        {/* Right Side: Data Summary */}
        <div className="summary-card details-summary">
          <h4>Property Specifications</h4>
          <ul className="details-list">
            <li>
              <span>Ad Title:</span> <strong>{formData.title}</strong>
            </li>
            <li>
              <span>Category:</span>{" "}
              <strong>{category === "land" ? "Land" : "House"}</strong>
            </li>
            <li>
              <span>Price:</span> <strong>Rs. {formData.price}</strong>
            </li>
            {category === "land" ? (
              <>
                <li>
                  <span>Land Type:</span> <strong>{formData.landType}</strong>
                </li>
                <li>
                  <span>Size:</span>{" "}
                  <strong>
                    {formData.landSize} {formData.sizeUnit}
                  </strong>
                </li>
              </>
            ) : (
              <>
                <li>
                  <span>Bedrooms:</span> <strong>{formData.bedrooms}</strong>
                </li>
                <li>
                  <span>Bathrooms:</span> <strong>{formData.bathrooms}</strong>
                </li>
                <li>
                  <span>House Size:</span>{" "}
                  <strong>{formData.houseSize} sqft</strong>
                </li>
              </>
            )}
            <li>
              <span>Contact:</span> <strong>{formData.contactNumber}</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="description-review">
        <h4>Description</h4>
        <p>{formData.description || "No description provided."}</p>
      </div>

      <div className="admin-notice">
        <p>
          By clicking "Send to Admin", your property will be reviewed and
          published within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default PostSuccess;

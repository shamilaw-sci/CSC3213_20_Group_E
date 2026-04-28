import React from 'react';
import './LandForm.css';

const LandForm = ({ 
    title, setTitle, 
    landType, setLandType, 
    landSize, setLandSize, 
    sizeUnit, setSizeUnit, 
    price, setPrice, 
    priceUnit, setPriceUnit, 
    calculatedTotal, 
    contactNumber, setContactNumber, 
    description, setDescription 
}) => {

    const handleSizeUnitChange = (e) => {
        const selectedUnit = e.target.value;
        setSizeUnit(selectedUnit);
        // Force Total Price if Akkara is selected
        if (selectedUnit === 'akkara') {
            setPriceUnit('total');
        }
    };

    return (
        <div className="form-grid">
            {/* Title */}
            <div className="form-group full-width">
                <label>Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. 15 Perches Land for Sale in Kandy" 
                    className="form-control" 
                />
            </div>

            {/* Land Type */}
            <div className="form-group">
                <label>Land Type</label>
                <select value={landType} onChange={(e) => setLandType(e.target.value)} className="form-control">
                    <option value="agricultural">Agricultural</option>
                    <option value="commercial">Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Land Size & Unit */}
            <div className="form-group flex-group">
                <div className="half-width">
                    <label>Land Size</label>
                    <input type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} placeholder="e.g. 15" className="form-control" />
                </div>
                <div className="half-width">
                    <label>Unit</label>
                    <select value={sizeUnit} onChange={handleSizeUnitChange} className="form-control">
                        <option value="perches">Perches</option>
                        <option value="akkara">Akkara (Acres)</option>
                    </select>
                </div>
            </div>

            {/* Price & Price Unit */}
            <div className="form-group flex-group">
                <div className="half-width">
                    <label>Price (Rs.)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500000" className="form-control" />
                </div>
                <div className="half-width">
                    <label>Price Type</label>
                    <select 
                        value={priceUnit} 
                        onChange={(e) => setPriceUnit(e.target.value)} 
                        className="form-control"
                        disabled={sizeUnit === 'akkara'}
                    >
                        <option value="total">Total Price</option>
                        {sizeUnit === 'perches' && (
                            <option value="perches">1 Perch Price</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Calculation Display */}
            {calculatedTotal !== null && (
                <div className="form-group full-width calculation-box">
                    <p><strong>Calculated Total Price:</strong> Rs. {calculatedTotal.toLocaleString()}</p>
                    <span className="calc-note">
                        ({landSize} {sizeUnit} × Rs. {price} per perch)
                    </span>
                </div>
            )}

            {/* Contact Number */}
            <div className="form-group full-width">
                <label>Contact Number (Phone / WhatsApp)</label>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g. 077 123 4567" className="form-control" />
            </div>

            {/* Description */}
            <div className="form-group full-width">
                <label>Description</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value.substring(0, 5000))} 
                    rows="4" 
                    placeholder="Describe the land, nearby facilities, clear deeds, etc." 
                    className="form-control"
                ></textarea>
                <div className="char-count-wrapper">
                    <span className="char-count">{description.length} / 5000</span>
                </div>
            </div>
        </div>
    );
};

export default LandForm;
import React from 'react';
import  './HouseForm.css';

const HouseForm = ({ 
    title, setTitle, 
    bedrooms, setBedrooms, 
    bathrooms, setBathrooms, 
    houseSize, setHouseSize, 
    landSize, setLandSize, 
    sizeUnit, setSizeUnit, 
    price, setPrice, 
    contactNumber, setContactNumber, 
    description, setDescription 
}) => {
    return (
        <div className="form-grid">
            <div className="form-group full-width">
                <label> Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Modern 3-Bedroom House in Colombo" className="form-control" />
            </div>

            <div className="form-group">
                <label>Bedrooms</label>
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-control">
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, '6+'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>Bathrooms</label>
                <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="form-control">
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, '6+'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>House Size (sqft)</label>
                <input type="number" value={houseSize} onChange={(e) => setHouseSize(e.target.value)} placeholder="What's the size of your property?" className="form-control" />
            </div>

            <div className="form-group flex-group">
                <div className="half-width">
                    <label>Land Size</label>
                    <input type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} className="form-control" />
                </div>
                <div className="half-width">
                    <label>Unit</label>
                    <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)} className="form-control">
                        <option value="perches">Perches</option>
                        <option value="akkara">Akkara</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Price (Rs.)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="form-control" />
            </div>

            <div className="form-group full-width">
                <label>Contact Number (Call / WhatsApp)</label>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="form-control" />
            </div>

            <div className="form-group full-width">
                <label>Description (Max 5000 characters)</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value.substring(0, 5000))} 
                    rows="6" 
                    className="form-control"
                ></textarea>
                <small className="char-count">{description.length} / 5000</small>
            </div>
        </div>
    );
};

export default HouseForm;
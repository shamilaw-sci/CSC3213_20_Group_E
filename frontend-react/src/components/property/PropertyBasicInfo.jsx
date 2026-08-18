import React from "react";

// Sri Lankan Districts
const sriLankaDistricts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

// District Coordinates
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
};

const PropertyBasicInfo = ({ formData, setFormData, handleChange }) => {
  
  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      type,
      listingType:
        type === "Rent House" || type === "Rent Villa" ? "Rent" : "Sale",
      bedrooms: type === "Land" ? "" : formData.bedrooms,
      bathrooms: type === "Land" ? "" : formData.bathrooms,
      houseSize:
        type === "Rent House" || type === "Rent Villa" ? formData.houseSize : "",
      landSize:
        type === "Rent House" || type === "Rent Villa" ? "" : formData.landSize,
      pricePeriod:
        type === "Rent House" || type === "Rent Villa" ? "Month" : "",
    });
  };

  return (
    <>
      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
        Property Type <span className="text-red-500">*</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* House */}
        <div
          onClick={() => handleTypeChange("House")}
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            formData.type === "House"
              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]"
              : "border-gray-200 hover:border-blue-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="font-bold text-lg">House</span>
        </div>
        {/* Land */}
        <div
          onClick={() => handleTypeChange("Land")}
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            formData.type === "Land"
              ? "border-green-600 bg-green-50 text-green-700 shadow-md transform scale-[1.02]"
              : "border-gray-200 hover:border-green-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-bold text-lg">Land Only</span>
        </div>
        {/* Rent House */}
        <div
          onClick={() => handleTypeChange("Rent House")}
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            formData.type === "Rent House"
              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]"
              : "border-gray-200 hover:border-purple-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm7 10v-6h4v6" />
          </svg>
          <span className="font-bold text-lg">Rent House</span>
        </div>
        {/* Rent Villa */}
        <div
          onClick={() => handleTypeChange("Rent Villa")}
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            formData.type === "Rent Villa"
              ? "border-orange-600 bg-orange-50 text-orange-700 shadow-md transform scale-[1.02]"
              : "border-gray-200 hover:border-orange-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-bold text-lg">Rent Villa</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
        Basic Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder={
              formData.type === "House"
                ? "e.g. Beautiful 2-Story House in Colombo 07"
                : formData.type === "Land"
                ? "e.g. 15 Perch Prime Land in Malabe"
                : formData.type === "Rent House"
                ? "e.g. Fully Furnished 3 Bedroom House for Rent in Kandy"
                : "Enter Property Title"
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Price (Rs.) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="Enter Price"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            {(formData.type === "Rent House" || formData.type === "Rent Wela") && (
              <select
                name="pricePeriod"
                value={formData.pricePeriod}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="Month">Month</option>
                <option value="Year">Year</option>
              </select>
            )}
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            District <span className="text-red-500">*</span>
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={(e) => {
              const district = e.target.value;
              setFormData({ ...formData, district });
              if (districtLocations[district]) {
                const [lat, lng] = districtLocations[district];
                setFormData((prev) => ({
                  ...prev,
                  district,
                  latitude: lat,
                  longitude: lng,
                }));
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select District</option>
            {sriLankaDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Nearby City / Town <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Kadawatha"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Full Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 123, Main Road, Kadawatha"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Contact Number (WhatsApp / Call) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            placeholder="e.g. 0771234567"
            pattern="[0-9]{10}"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe the key features of your property..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          ></textarea>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
        Property Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(formData.type === "House" ||
          formData.type === "Rent House" ||
          formData.type === "Rent Wela") && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="e.g. 3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="e.g. 2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </>
        )}

        {formData.type === "House" && (
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              House Size (sqft)
            </label>
            <input
              type="number"
              name="houseSize"
              value={formData.houseSize}
              onChange={handleChange}
              placeholder="e.g. 1800"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {(formData.type === "Land" || formData.type === "House") && (
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Land Size (Perches)
            </label>
            <input
              type="number"
              name="landSize"
              value={formData.landSize}
              onChange={handleChange}
              placeholder="e.g. 15"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default PropertyBasicInfo;

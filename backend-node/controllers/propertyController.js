const propertyRepository = require('../repositories/propertyRepository');

const addProperty = async (req, res, next) => {
  let uploadedFiles = [];
  try {
    const {
      type,
      listingType,
      title,
      description,
      price,
      pricePeriod,
      address,
      district,
      city,
      contactNumber,
      bedrooms,
      bathrooms,
      landSize,
      houseSize,
      latitude,
      longitude,
      boundary,
    } = req.body;

    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res.status(403).json({ error: "Access denied. Only Sellers and Agents can add properties." });
    }

    const files = req.files;
    let imageUrls = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
        const filePath = `public/${fileName}`;

        const publicUrl = await propertyRepository.uploadImage(filePath, file.buffer, file.mimetype);
        uploadedFiles.push(filePath);
        return publicUrl;
      });

      imageUrls = await Promise.all(uploadPromises);
    }

    const property = await propertyRepository.addProperty({
      type,
      listing_type: listingType || 'Sale',
      title,
      description,
      price,
      price_period: pricePeriod || null,
      address: address || null,
      district: district || null,
      city: city || null,
      contact_number: contactNumber || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      land_size: landSize || null,
      house_size: houseSize || null,
      latitude,
      longitude,
      boundary,
      images: imageUrls,
      seller_id: req.user.id,
      status: "pending",
      created_at: new Date(),
    });

    res.status(201).json({
      message: "Property added successfully",
      property,
    });
  } catch (error) {
    if (uploadedFiles.length > 0) {
      propertyRepository.removeImages(uploadedFiles).catch((e) => console.error("Rollback failed:", e));
    }
    next(error);
  }
};

const getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await propertyRepository.getProperties(from, to);

    res.status(200).json({
      message: "Properties fetched successfully",
      count: data.length,
      totalCount: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      properties: data,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProperties = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res.status(403).json({ message: "Only sellers and agents can view submitted properties." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await propertyRepository.getMyProperties(req.user.id, from, to);

    res.status(200).json({
      message: "Seller properties fetched successfully",
      count: data.length,
      totalCount: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      properties: data,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res.status(403).json({ message: "Only sellers and agents can update submitted properties." });
    }

    const existingProperty = await propertyRepository.getPropertyById(req.params.id);

    if (!existingProperty || existingProperty.seller_id !== req.user.id) {
      return res.status(404).json({ message: "Property not found." });
    }

    if (existingProperty.status === "approved") {
      return res.status(400).json({ message: "Approved properties cannot be edited from this page." });
    }

    const {
      type,
      title,
      description,
      price,
      pricePeriod,
      address,
      district,
      city,
      contactNumber,
      bedrooms,
      bathrooms,
      landSize,
      houseSize,
    } = req.body;

    const updates = {
      type,
      title,
      description,
      price,
      price_period: pricePeriod || null,
      address: address || null,
      district,
      city,
      contact_number: contactNumber || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      land_size: landSize || null,
      house_size: houseSize || null,
      status: "pending",
      rejection_reason: null,
    };

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    let { data: property, error: updateError } = await propertyRepository.updateMyProperty(req.params.id, req.user.id, updates);

    if (updateError && updateError.message?.includes("rejection_reason")) {
      const { rejection_reason, ...fallbackUpdates } = updates;
      const fallback = await propertyRepository.updateMyProperty(req.params.id, req.user.id, fallbackUpdates);
      property = fallback.data;
      updateError = fallback.error;
    }

    if (updateError) throw updateError;

    res.status(200).json({
      message: "Property updated and sent to admin review.",
      property,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMyProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res.status(403).json({ message: "Only sellers and agents can delete properties." });
    }

    const success = await propertyRepository.deleteMyProperty(req.params.id, req.user.id);

    if (!success) {
      return res.status(404).json({ message: "Property not found or unauthorized." });
    }

    res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const incrementViews = async (req, res, next) => {
  try {
    const newCount = await propertyRepository.incrementViews(req.params.id);
      
    if (!newCount) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.status(200).json({ message: "View recorded", views_count: newCount });
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const data = await propertyRepository.getPropertyById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Property not found." });
    }

    res.status(200).json({
      message: "Property fetched successfully",
      property: data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProperty,
  getProperties,
  getMyProperties,
  updateMyProperty,
  deleteMyProperty,
  incrementViews,
  getPropertyById,
};

/**
 * @file propertyController.js
 * @description Controller responsible for handling property-related API requests including adding, fetching, and updating properties.
 */

// Initialize Supabase client using environment variables
const supabase = require('../config/supabase');
/**
 * Add a new property listing to the database.
 * Processes uploaded images concurrently, formats property data, and saves it into Supabase.
 * Implements rollback if DB insert fails.
 */
const addProperty = async (req, res, next) => {
  let uploadedFiles = []; // Track uploaded file paths for rollback
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

    // Check if the user is a SELLER or AGENT
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res
        .status(403)
        .json({ error: "Access denied. Only Sellers and Agents can add properties." });
    }

    const files = req.files;

    let imageUrls = [];

    // Upload images to Supabase Storage concurrently
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname.replace(
          /\s/g,
          "_"
        )}`;
        const filePath = `public/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        uploadedFiles.push(filePath); // Track for potential rollback

        const { data: publicUrlData } = supabase.storage
          .from("properties")
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      });

      imageUrls = await Promise.all(uploadPromises);
    }

    // Insert property data into Supabase properties table
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .insert([
        {
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
          boundary: boundary, // Provided as a WKT String (POLYGON) directly from the frontend
          images: imageUrls,
          seller_id: req.user.id,
          status: "pending",
          created_at: new Date(),
        },
      ])
      .select();

    if (propertyError) {
      // Rollback: Remove images if DB insertion failed
      if (uploadedFiles.length > 0) {
        await supabase.storage.from("properties").remove(uploadedFiles);
      }
      throw propertyError;
    }

    res.status(201).json({
      message: "Property added successfully",
      property: propertyData[0],
    });
  } catch (error) {
    // Rollback on any unexpected error during the process
    if (uploadedFiles.length > 0) {
      await supabase.storage
        .from("properties")
        .remove(uploadedFiles)
        .catch((e) => console.error("Rollback failed:", e));
    }
    next(error);
  }
};

/**
 * Retrieve all property listings from the database with pagination.
 * Sorted in descending order based on the creation date.
 */
const getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("properties")
      .select("*, users(name, role)", { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

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

/**
 * Retrieve property submissions for the logged-in seller with pagination.
 * This includes pending/rejected listings so sellers can track review progress.
 */
const getMyProperties = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res
        .status(403)
        .json({ message: "Only sellers and agents can view submitted properties." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("properties")
      .select("*, users(name, role)", { count: "exact" })
      .eq("seller_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

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

/**
 * Update a seller's own pending/rejected property submission.
 * Saving edits resubmits the property for admin review.
 */
const updateMyProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res
        .status(403)
        .json({ message: "Only sellers and agents can update submitted properties." });
    }

    const { data: existingProperty, error: fetchError } = await supabase
      .from("properties")
      .select("id, seller_id, status")
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id)
      .single();

    if (fetchError || !existingProperty) {
      return res.status(404).json({ message: "Property not found." });
    }

    if (existingProperty.status === "approved") {
      return res.status(400).json({
        message: "Approved properties cannot be edited from this page.",
      });
    }

    const {
      type,
      title,
      description,
      price,
      pricePeriod,
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

    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    let { data: property, error: updateError } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id)
      .select()
      .single();

    if (updateError && updateError.message?.includes("rejection_reason")) {
      const { rejection_reason, ...fallbackUpdates } = updates;
      const fallback = await supabase
        .from("properties")
        .update(fallbackUpdates)
        .eq("id", req.params.id)
        .eq("seller_id", req.user.id)
        .select()
        .single();
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

/**
 * Delete a seller's own property submission.
 */
const deleteMyProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
      return res.status(403).json({ message: "Only sellers and agents can delete properties." });
    }

    const { id } = req.params;

    // First check if property belongs to seller
    const { data: prop, error: checkError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", id)
      .eq("seller_id", req.user.id)
      .single();

    if (checkError || !prop) {
      return res.status(404).json({ message: "Property not found or unauthorized." });
    }

    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    next(error);
  }
};

/**
 * Increment the view count for a specific property.
 */
const incrementViews = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Use RPC function if available, or fetch and increment
    // Since we don't have an RPC function right now, fetch and increment
    const { data: prop, error: fetchError } = await supabase
      .from("properties")
      .select("views_count")
      .eq("id", id)
      .single();
      
    if (fetchError) {
      return res.status(404).json({ message: "Property not found" });
    }

    const newCount = (prop.views_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from("properties")
      .update({ views_count: newCount })
      .eq("id", id);
      
    if (updateError) throw updateError;
    
    res.status(200).json({ message: "View recorded", views_count: newCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a specific property by its ID.
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("properties")
      .select("*, users(name, role)")
      .eq("id", id)
      .single();

    if (error || !data) {
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

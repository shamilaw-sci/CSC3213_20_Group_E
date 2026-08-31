const propertyRepository = require('../repositories/propertyRepository');
const { generateSafeFileName } = require('../middleware/uploadMiddleware');

const addProperty = async(req, res, next) => {
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
            const uploadPromises = files.map(async(file) => {
                const fileName = generateSafeFileName(file.originalname);
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
            payment_status: "Unpaid",
            created_at: new Date(),
        });

        res.status(201).json({
            message: "Property created and awaiting payment",
            property,
        });
    } catch (error) {
        if (uploadedFiles.length > 0) {
            propertyRepository.removeImages(uploadedFiles).catch((e) => console.error("Rollback failed:", e));
        }
        next(error);
    }
};

const getProperties = async(req, res, next) => {
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

const getMyProperties = async(req, res, next) => {
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

const updateMyProperty = async(req, res, next) => {
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

        if (updateError && updateError.message ? .includes("rejection_reason")) {
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

const deleteMyProperty = async(req, res, next) => {
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

const incrementViews = async(req, res, next) => {
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

const getPropertyById = async(req, res, next) => {
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

/**
 * Find properties similar to a given property, using a weighted blend of
 * type, price, bedrooms, bathrooms, and distance (see utils/similarityEngine.js).
 * Only considers other approved, currently-listed properties as candidates.
 */
const getSimilarProperties = async(req, res, next) => {
    try {
        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);

        const { data: target, error: targetError } = await supabase
            .from("properties")
            .select("id, type, price, bedrooms, bathrooms, latitude, longitude")
            .eq("id", id)
            .single();

        if (targetError || !target) {
            return res.status(404).json({ message: "Property not found." });
        }

        // Pull a reasonably-sized pool of approved candidates to rank locally.
        // (For a much larger catalog this would move to a DB-side pre-filter,
        // but ranking in JS keeps the scoring logic simple and fully testable.)
        const { data: candidates, error: candidatesError } = await supabase
            .from("properties")
            .select("*, users(name, role)")
            .eq("status", "approved")
            .neq("id", id)
            .limit(200);

        if (candidatesError) throw candidatesError;

        const similarProperties = findSimilarProperties(target, candidates || [], limit);

        res.status(200).json({
            message: "Similar properties fetched successfully",
            properties: similarProperties,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Statistically compares a property's price-per-sqft against similar
 * properties (via similarityEngine) and classifies it as a Great Deal,
 * Fair Price, or Above Market, using a z-score (see utils/priceInsightEngine.js).
 */
const getPriceInsight = async(req, res, next) => {
    try {
        const { id } = req.params;

        const { data: target, error: targetError } = await supabase
            .from("properties")
            .select("id, type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size")
            .eq("id", id)
            .single();

        if (targetError || !target) {
            return res.status(404).json({ message: "Property not found." });
        }

        const { data: candidates, error: candidatesError } = await supabase
            .from("properties")
            .select("id, type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size")
            .eq("status", "approved")
            .neq("id", id)
            .limit(200);

        if (candidatesError) throw candidatesError;

        // Reuse the same similarity ranking as "Similar Properties" so the price
        // comparison is against genuinely comparable listings, not the whole catalog.
        const comparableProperties = findSimilarProperties(target, candidates || [], 15);
        const insight = calculatePriceInsight(target, comparableProperties);

        if (!insight) {
            return res.status(200).json({
                message: "Not enough comparable data yet",
                insight: null,
            });
        }

        res.status(200).json({
            message: "Price insight calculated successfully",
            insight,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Free-text keyword search across approved property listings, ranked by
 * TF-IDF relevance (see utils/searchRelevance.js) rather than just recency.
 * Searches title, description, city, district, and type.
 */
const searchProperties = async(req, res, next) => {
    try {
        const { q, limit } = req.query;
        const resultLimit = Number(limit) || 20;

        // Pull a pool of approved listings to rank locally. For a much larger
        // catalog this would move to a DB-side full-text index, but ranking in
        // JS keeps the scoring logic simple, transparent, and fully testable.
        const { data: candidates, error } = await supabase
            .from("properties")
            .select("id, title, description, type, price, city, district, bedrooms, bathrooms")
            .eq("status", "approved")
            .limit(300);

        if (error) throw error;

        const ranked = rankPropertiesByRelevance(q, candidates || []).slice(0, resultLimit);

        res.status(200).json({
            message: "Search results fetched successfully",
            query: q,
            count: ranked.length,
            properties: ranked,
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
    getSimilarProperties,
    getPriceInsight,
    searchProperties,
};
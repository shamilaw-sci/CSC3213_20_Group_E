const propertyRepository = require('../../repositories/propertyRepository');
const { findSimilarProperties } = require("../../utils/similarityEngine");
const { calculatePriceInsight } = require("../../utils/priceInsightEngine");
const { rankPropertiesByRelevance } = require("../../utils/searchRelevance");
const supabase = require('../../config/supabase');

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
            .select("id, type, listing_type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size")
            .eq("id", id)
            .single();

        if (targetError || !target) {
            return res.status(404).json({ message: "Property not found." });
        }

        const { data: candidates, error: candidatesError } = await supabase
            .from("properties")
            .select("id, type, listing_type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size")
            .eq("status", "approved")
            .neq("id", id)
            .limit(200);

        if (candidatesError) throw candidatesError;

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

module.exports = { incrementViews, getSimilarProperties, getPriceInsight, searchProperties };

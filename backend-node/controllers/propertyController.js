const { getProperties, getMyProperties, getPropertyById } = require('./property/propertyReadController');
const propertyRepository = require('../repositories/propertyRepository');
const { generateSafeFileName } = require('../middleware/uploadMiddleware');
const { findSimilarProperties } = require("../utils/similarityEngine");
const { calculatePriceInsight } = require("../utils/priceInsightEngine");
const { rankPropertiesByRelevance } = require("../utils/searchRelevance");
const supabase = require('../config/supabase');

const { addProperty, updateMyProperty, deleteMyProperty } = require('./property/propertyWriteController');
const { incrementViews, getSimilarProperties, getPriceInsight, searchProperties } = require('./property/propertyDiscoveryController');

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

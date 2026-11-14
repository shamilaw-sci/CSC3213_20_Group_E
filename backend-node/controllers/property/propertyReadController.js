const propertyRepository = require('../../repositories/propertyRepository');
const recordSearchDemand = require('../../utils/recordSearchDemand');

const getProperties = async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count } = await propertyRepository.getProperties(from, to);

        recordSearchDemand(req, req.query.search_district);

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

const getPropertyById = async(req, res, next) => {
    try {
        const data = await propertyRepository.getPropertyById(req.params.id);

        const canViewPrivateListing = req.user && data && (
            req.user.id === data.seller_id || req.user.role === 'ADMIN'
        );
        if (!data || (data.status !== 'approved' && !canViewPrivateListing)) {
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

module.exports = { getProperties, getMyProperties, getPropertyById };

const repository = require('../../repositories/adminPromotionRepository');
const validator = require('../../validators/adminPromotionValidator');
const handleError = (error, res, next) => {
    if (error.code === '42501') return res.status(403).json({ message: 'Admin access required.' });
    if (error.statusCode === 400) return res.status(400).json({ message: error.message });
    if (error.code === 'PZ404') return res.status(404).json({ message: 'Listing not found.' });
    if (error.code === 'PZ409') return res.status(409).json({ message: 'Only approved, paid, nonarchived listings can be featured. Refresh the list.' });
    next(error);
};
exports.getBoosts = async (req, res, next) => {
    try { res.json(await repository.list(validator.list(req.query))); }
    catch (error) { handleError(error, res, next); }
};
exports.toggleBoost = async (req, res, next) => {
    try {
        const { id, enabled } = validator.mutation(req);
        const result = await repository.setEnabled(id, enabled, req.user.id);
        if (result.property_id !== id || result.enabled !== enabled) throw new Error('Promotion update was not confirmed.');
        res.json({ message: enabled ? 'Featured placement enabled.' : 'Featured placement disabled.', promotion: result });
    } catch (error) { handleError(error, res, next); }
};
exports.getFeaturedProperties = async (req, res, next) => {
    try { res.json({ properties: await repository.featured(validator.featuredLimit(req.query)) }); }
    catch (error) { handleError(error, res, next); }
};

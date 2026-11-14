const repository = require('../../repositories/listingReportRepository');
const { submitListingReportSchema, listingReportQuerySchema, resolveListingReportSchema } = require('../../validators/listingReportValidator');

const failure = (error, res, next) => {
    const statuses = { PZ001: 404, PZ002: 409, PZ003: 403, '23505': 409, '22023': 400 };
    if (statuses[error.code]) return res.status(statuses[error.code]).json({ message: error.code === '23505' ? 'You already have an open report for this listing.' : error.message });
    return next(error);
};
const parse = (schema, req, res) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) { res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid report request' }); return null; }
    return result.data;
};
const submitListingReport = async (req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ message: 'Sign in to report a listing.' });
    const input = parse(submitListingReportSchema, req, res); if (!input) return;
    try {
        const report = await repository.submit(input.body, req.user.id);
        return res.status(201).json({ message: 'Report submitted for review.', report: { id: report.id, status: report.status, created_at: report.created_at } });
    } catch (error) { return failure(error, res, next); }
};
const getReportedContent = async (req, res, next) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
    const input = parse(listingReportQuerySchema, req, res); if (!input) return;
    try { return res.json(await repository.list(input.query)); } catch (error) { return failure(error, res, next); }
};
const resolveReport = async (req, res, next) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
    const input = parse(resolveListingReportSchema, req, res); if (!input) return;
    try { const report = await repository.resolve(input.params.id, req.user.id, input.body); return res.json({ message: 'Report decision saved.', report }); }
    catch (error) { return failure(error, res, next); }
};
module.exports = { submitListingReport, getReportedContent, resolveReport };

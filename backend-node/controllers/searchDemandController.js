const { ZodError } = require('zod');
const repository = require('../repositories/searchDemandRepository');
const { parseWindow } = require('../validators/searchDemandValidator');

async function getSearchHeatmap(req, res, next) {
    let window;
    try { window = parseWindow(req.query); } catch (error) {
        if (error instanceof ZodError || error.status === 400) return res.status(400).json({ message: 'Choose valid YYYY-MM-DD dates, from before to, at most 366 days, ending no later than today in Sri Lanka.' });
        return next(error);
    }
    try {
        const data = await repository.aggregate(window);
        const districts = (data?.districts || []).map(row => ({ district: row.district, count: Number(row.count) }));
        return res.json({ districts, total: districts.reduce((sum, row) => sum + row.count, 0), window,
            trackingStartedAt: data?.tracking_started_at || null,
            explanation: 'Counts successful, explicitly submitted district searches. Excludes automatic map refreshes, freehand areas and text without an exact district. No historical estimates or unique-person counts.' });
    } catch (error) {
        // Missing migration or unavailable storage must not look like zero searches.
        return res.status(503).json({ message: 'Search demand is unavailable. Check that its reviewed database migration has been applied.' });
    }
}
module.exports = { getSearchHeatmap };

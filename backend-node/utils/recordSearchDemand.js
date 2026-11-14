const crypto = require('crypto');
const repository = require('../repositories/searchDemandRepository');
const { normalizeDistrict } = require('../validators/searchDemandValidator');
const buckets = new Map();
const secret = crypto.randomBytes(32);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Analytics is optional. Invalid/missing event metadata never changes search results.
module.exports = function recordSearchDemand(req, submittedDistrict = req.query.q) {
    const eventId = req.query.search_event_id;
    const district = normalizeDistrict(submittedDistrict);
    if (!district || typeof eventId !== 'string' || !uuid.test(eventId)) return;
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.expires < now) buckets.delete(key);
    const key = crypto.createHmac('sha256', secret).update(req.ip || 'unknown').digest('hex');
    const bucket = buckets.get(key) || { count: 0, expires: now + 60000 };
    // Bound memory and accepted analytics events independently of ordinary search.
    if ((!buckets.has(key) && buckets.size >= 10000) || bucket.count >= 20) return;
    bucket.count += 1;
    buckets.set(key, bucket);
    void repository.record(eventId, district).catch(() => console.warn('District search recording unavailable'));
};

const { z } = require('zod');

const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
const normalizeDistrict = value => typeof value === 'string'
    ? DISTRICTS.find(district => district.toLowerCase() === value.trim().replace(/\s+/g, ' ').toLowerCase()) || null : null;
const localToday = () => {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
function parseWindow(query) {
    const today = localToday();
    const parsed = z.object({ from: dateSchema.optional(), to: dateSchema.optional() }).parse({ from: query.from || undefined, to: query.to || undefined });
    const to = parsed.to || today;
    const from = parsed.from || new Date(Date.parse(`${to}T00:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10);
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
    if (days < 1 || days > 366 || to > today) {
        const error = new Error('Choose a past or current date range of 1 to 366 days.');
        error.status = 400;
        throw error;
    }
    return { from, to, days, timezone: 'Asia/Colombo' };
}
module.exports = { DISTRICTS, normalizeDistrict, parseWindow };

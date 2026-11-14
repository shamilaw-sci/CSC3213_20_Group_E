const { formatMoney } = require('../utils/paymentMoney');

function parseListingFee(value) {
    if ((typeof value !== 'string' && typeof value !== 'number')
        || (typeof value === 'number' && !Number.isFinite(value))) {
        throw new Error('Invalid listing fee.');
    }
    if (typeof value === 'string' && value.length > 64) throw new Error('Invalid listing fee.');
    return formatMoney(typeof value === 'string' ? value.trim() : value);
}
module.exports = { parseListingFee };

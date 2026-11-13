const formatMoney = value => {
    const match = String(value).match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
    if (!match) throw new Error('Invalid payment amount');
    const cents = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
    if (cents <= 0n || cents > 999999999999n) throw new Error('Invalid payment amount');
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
};
module.exports = { formatMoney };

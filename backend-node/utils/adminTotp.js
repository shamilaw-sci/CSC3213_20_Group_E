const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;

function encodeBase32(bytes) {
    let bits = 0;
    let value = 0;
    let encoded = '';
    for (const byte of bytes) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            encoded += ALPHABET[(value >>> bits) & 31];
        }
    }
    if (bits) encoded += ALPHABET[(value << (5 - bits)) & 31];
    return encoded;
}

function newTotpSecret() {
    const key = randomBytes(20);
    return { key, base32: encodeBase32(key) };
}

function codeForStep(key, step) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const mac = createHmac('sha1', key).update(counter).digest();
    const offset = mac[mac.length - 1] & 15;
    const value = (mac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    return String(value).padStart(6, '0');
}

function matchingTotpStep(key, code, now = Date.now()) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
    const current = Math.floor(now / 1000 / PERIOD_SECONDS);
    for (const step of [current, current - 1, current + 1]) {
        if (step >= 0 && timingSafeEqual(Buffer.from(code), Buffer.from(codeForStep(key, step)))) return step;
    }
    return null;
}

module.exports = { newTotpSecret, matchingTotpStep };

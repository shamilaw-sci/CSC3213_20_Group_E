const bcrypt = require('bcryptjs');
const tables = ['users','properties','saved_searches','transactions','payment_orders','payment_receipt_outbox','leads','conversations','messages','message_receipts','platform_settings'];
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const requireMatch = value => { if (!value) throw new Error('Exact recovery identity or baseline refused.'); };
const sameUser = (a, b) => a?.id === b.id && a.email === b.email && a.role === b.role;

function validateRecoveryJournal(journal, created) {
    requireMatch(uuid(journal?.run) && journal.users?.length === 2 && journal.fixtures?.length === 4);
    requireMatch(JSON.stringify(Object.keys(journal.beforeHashes || {}).sort()) === JSON.stringify([...tables].sort()));
    requireMatch(Object.values(journal.beforeHashes).every(h => typeof h === 'string' && /^[a-f0-9]{64}$/.test(h)));
    const users = journal.users;
    requireMatch(new Set(users.map(u => u.id)).size === 2 && new Set(users.map(u => u.role)).size === 2);
    for (const u of users) requireMatch(uuid(u.id) && ['SELLER','AGENT'].includes(u.role) && u.email === `${journal.run}-${u.role.toLowerCase()}@example.test`);
    requireMatch(new Set(journal.fixtures.map(f => f.label)).size === 4);
    for (const f of journal.fixtures) requireMatch(uuid(f.id) && ['Visa','Mastercard','Cancel','Decline'].includes(f.label)
        && !f.createdViaUI && users.some(u => sameUser(f.user, u)));
    const fixtures = [...journal.fixtures];
    if (created !== undefined) {
        requireMatch(created && typeof created === 'object' && created.run === journal.run && Array.isArray(created.fixtures));
        const seen = new Set();
        for (const f of created.fixtures) {
            requireMatch(f && !seen.has(f.id)); seen.add(f.id);
            const original = journal.fixtures.find(p => p.id === f.id);
            if (original) { requireMatch(!f.createdViaUI && f.label === original.label && sameUser(f.user, original.user)); continue; }
            requireMatch(f.createdViaUI === true && uuid(f.id) && typeof f.label === 'string' && f.label.length > 0
                && sameUser(f.user, users.find(u => u.role === 'SELLER')));
            fixtures.push(f);
        }
    }
    requireMatch(new Set(fixtures.map(f => f.id)).size === fixtures.length);
    return { ...journal, fixtures };
}

async function verifyRecoveryUser(user, stored, seller, login) {
    requireMatch(stored.email === user.email && stored.role === user.role);
    if (stored.password_hash === 'not-a-login-hash') return;
    requireMatch(login?.email === seller.email && typeof login.password === 'string' && login.password.length > 0);
    requireMatch(typeof stored.password_hash === 'string' && await bcrypt.compare(login.password, stored.password_hash));
}
module.exports = { validateRecoveryJournal, verifyRecoveryUser, tables };

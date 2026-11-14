const { validateRecoveryJournal, verifyRecoveryUser } = require('../integration/checkout-recovery.cjs');
const bcrypt = require('bcryptjs');
const run = '11111111-1111-4111-8111-111111111111';
const users = ['SELLER', 'AGENT'].map((role, i) => ({ id: `${i + 2}2222222-2222-4222-8222-222222222222`, role, email: `${run}-${role.toLowerCase()}@example.test` }));
const makeJournal = () => ({ run, users: structuredClone(users), fixtures: ['Visa', 'Mastercard', 'Cancel', 'Decline'].map((label, i) => ({ id: `${i + 4}3333333-3333-4333-8333-333333333333`, label, user: users[i === 1 ? 1 : 0] })),
    beforeHashes: Object.fromEntries(['users', 'properties', 'saved_searches', 'transactions', 'payment_orders', 'payment_receipt_outbox', 'leads', 'conversations', 'messages', 'message_receipts', 'platform_settings'].map(t => [t, 'a'.repeat(64)])) });

test('recovery requires complete eleven-table hashes and exact run identities', () => {
    expect(validateRecoveryJournal(makeJournal()).fixtures).toHaveLength(4);
    for (const change of [j => delete j.beforeHashes, j => delete j.beforeHashes.users, j => j.beforeHashes.users = 'bad',
        j => j.users[0].email = 'normal@example.test', j => j.users[1].role = 'SELLER',
        j => j.fixtures[1].label = 'Visa', j => j.fixtures[1].id = j.fixtures[0].id,
        j => j.fixtures[0].user = { ...j.users[0], email: 'other@example.test' }]) {
        const j = makeJournal(); change(j); expect(() => validateRecoveryJournal(j)).toThrow();
    }
});
test('same-run created journal is bounded to the disposable seller and unique properties', () => {
    const j = makeJournal();
    const created = { id: '99999999-9999-4999-8999-999999999999', label: 'Disposable land', user: users[0], createdViaUI: true };
    expect(validateRecoveryJournal(j, { run, fixtures: [...j.fixtures, created] }).fixtures).toHaveLength(5);
    for (const extra of [{ run: 'other', fixtures: [created] }, { run, fixtures: [{ ...created, user: users[1] }] },
        { run, fixtures: [{ ...created, label: '' }] }, { run, fixtures: [{ ...created, id: j.fixtures[0].id }] },
        null, false, 0, '', { run, fixtures: [j.fixtures[0], j.fixtures[0]] }]) {
        expect(() => validateRecoveryJournal(j, extra)).toThrow();
    }
});
test('bcrypt recovery verifies retained password and exact email/role, not just hash format', async () => {
    const password = 'disposable-test-password';
    const row = { email: users[0].email, role: 'SELLER', password_hash: await bcrypt.hash(password, 4) };
    const login = { email: users[0].email, password };
    await expect(verifyRecoveryUser(users[0], row, users[0], login)).resolves.toBeUndefined();
    for (const [changed, credentials] of [[row, { ...login, password: 'wrong' }], [row, { ...login, email: 'old@example.test' }],
        [{ ...row, role: 'ADMIN' }, login], [{ ...row, email: 'real@example.test' }, login]]) {
        await expect(verifyRecoveryUser(users[0], changed, users[0], credentials)).rejects.toThrow();
    }
    await expect(verifyRecoveryUser(users[1], { email: users[1].email, role: 'AGENT', password_hash: row.password_hash }, users[0], login)).resolves.toBeUndefined();
    await expect(verifyRecoveryUser(users[0], { ...row, password_hash: 'not-a-login-hash' }, users[0])).resolves.toBeUndefined();
});

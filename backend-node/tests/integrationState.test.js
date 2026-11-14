const { snapshotState, assertSameState, assertOwnedListings } = require('../integration/database-state.cjs');

describe('Local integration state preservation (no database connections)', () => {
    test('snapshots complete platform settings without changing the listing fee', async () => {
        const settings = [{ id: 'listing_fee', value: '750.00', updated_at: 'unchanged' }];
        const client = { query: jest.fn().mockResolvedValue({ rows: [{ snapshot: settings }] }) };
        expect(await snapshotState(client, ['platform_settings'])).toEqual({ platform_settings: settings });
        expect(client.query).toHaveBeenCalledTimes(1);
        expect(client.query).toHaveBeenCalledWith("SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id), '[]'::jsonb) AS snapshot FROM public.platform_settings t");
    });
    test('snapshots complete CRM rows with deterministic primary and composite keys', async () => {
        const client = { query: jest.fn().mockResolvedValue({ rows: [{ snapshot: [] }] }) };
        expect(await snapshotState(client, ['leads', 'conversations', 'messages', 'message_receipts']))
            .toEqual({ leads: [], conversations: [], messages: [], message_receipts: [] });
        expect(client.query.mock.calls.map(([sql]) => sql)).toEqual([
            expect.stringContaining('ORDER BY lead_id'), expect.stringContaining('ORDER BY id'),
            expect.stringContaining('ORDER BY id'), expect.stringContaining('ORDER BY message_id,user_id'),
        ]);
    });
    test('snapshots complete saved searches in deterministic id order', async () => {
        const client = { query: jest.fn().mockResolvedValue({ rows: [{ snapshot: [{ id: 'search', filters: { version: 1 } }] }] }) };
        expect((await snapshotState(client, ['saved_searches'])).saved_searches).toEqual([{ id: 'search', filters: { version: 1 } }]);
        expect(client.query).toHaveBeenCalledWith(expect.stringContaining('to_jsonb(t) ORDER BY id'));
        expect(client.query).toHaveBeenCalledWith(expect.stringContaining('FROM public.saved_searches t'));
    });
    test('snapshots complete rows in deterministic id order for allowlisted tables', async () => {
        const client = { query: jest.fn().mockResolvedValue({ rows: [{ snapshot: [{ id: 'original', title: 'Preserve me' }] }] }) };
        const result = await snapshotState(client, ['users', 'properties']);
        expect(client.query.mock.calls.map(([sql]) => sql)).toEqual([
            expect.stringContaining('to_jsonb(t) ORDER BY id'), expect.stringContaining('to_jsonb(t) ORDER BY id'),
        ]);
        expect(result.properties).toEqual([{ id: 'original', title: 'Preserve me' }]);
    });
    test.each(['settings', 'users;DROP TABLE users', 'properties WHERE true'])('refuses table %s before querying', async table => {
        const client = { query: jest.fn() };
        await expect(snapshotState(client, [table])).rejects.toThrow(/snapshot table/);
        expect(client.query).not.toHaveBeenCalled();
    });
    test('accepts identical full snapshots', () => {
        expect(() => assertSameState({ users: [], properties: [{ id: 'p', price: 5 }] },
            { users: [], properties: [{ id: 'p', price: 5 }] })).not.toThrow();
    });
    test.each([
        { users: [{ id: 'unremoved-fixture' }], properties: [] },
        { users: [], properties: [{ id: 'original', title: 'Changed' }] },
        { users: [] },
    ])('rejects drift without exposing row contents', after => {
        expect(() => assertSameState({ users: [], properties: [{ id: 'original', title: 'Private original' }] }, after))
            .toThrow(/^Starting state not preserved/);
        try { assertSameState({ users: [{ id: 'secret-identity' }] }, after); }
        catch (error) { expect(error.message).not.toContain('secret-identity'); }
    });
    test('allows cleanup recovery only for run-owned listing rows', () => {
        expect(assertOwnedListings([{ id: 'p1', seller_id: 'own-seller' }], ['own-seller'])).toEqual(['p1']);
    });
    test('refuses a pre-existing or foreign-owner listing before cleanup', () => {
        expect(() => assertOwnedListings([{ id: 'p1', seller_id: 'other' }], ['own-seller'])).toThrow(/run-owned/);
    });
});

const tables = Object.freeze({ users: 'id', properties: 'id', saved_searches: 'id', transactions: 'id',
    payment_orders: 'id', payment_receipt_outbox: 'order_id', leads: 'lead_id', conversations: 'id',
    messages: 'id', message_receipts: 'message_id,user_id', platform_settings: 'id' });

async function snapshotState(client, names) {
    if (!names.length || names.some(name => !Object.hasOwn(tables, name))) throw new Error('Unsupported snapshot table.');
    const result = {};
    for (const name of names) {
        const response = await client.query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY ${tables[name]}), '[]'::jsonb) AS snapshot FROM public.${name} t`);
        result[name] = response.rows[0].snapshot;
    }
    return result;
}

function assertSameState(before, after) {
    if (JSON.stringify(Object.keys(before).sort()) !== JSON.stringify(Object.keys(after).sort())) {
        throw new Error('Starting state not preserved: snapshot table set differs.');
    }
    for (const name of Object.keys(before)) {
        if (JSON.stringify(before[name]) !== JSON.stringify(after[name])) {
            throw new Error(`Starting state not preserved for ${name}.`);
        }
    }
}

function assertOwnedListings(rows, sellerIds) {
    const owned = new Set(sellerIds);
    if (rows.some(row => !row.id || !owned.has(row.seller_id))) throw new Error('Cleanup requires run-owned listing rows.');
    return rows.map(row => row.id);
}

module.exports = { snapshotState, assertSameState, assertOwnedListings };

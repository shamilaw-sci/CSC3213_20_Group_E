const express = require('express');
const request = require('supertest');
const crypto = require('crypto');

// In-memory database boundary: run the real repository and webhook handler.
jest.mock('../config/supabase', () => {
    const db = { property: null, writes: [], writeError: null };
    db.from = () => {
        let update;
        let onlyUnpaid = false;
        const filters = [];
        const execute = async () => {
            const row = db.property;
            if (!row || filters.some(([key, value]) => row[key] !== value)) return { data: null, error: null };
            if (update) {
                if (db.writeError) return { data: null, error: db.writeError };
                if (onlyUnpaid && row.payment_status === 'Paid') return { data: null, error: null };
                db.writes.push({ ...update });
                Object.assign(row, update);
            }
            return { data: { ...row }, error: null };
        };
        const query = {
            select() { return query; },
            eq(key, value) { filters.push([key, value]); return query; },
            or(filter) {
                if (filter !== 'payment_status.is.null,payment_status.neq.Paid') throw new Error('Unexpected filter');
                onlyUnpaid = true;
                return query;
            },
            update(value) { update = value; return query; },
            single: execute, maybeSingle: execute,
        };
        return query;
    };
    return db;
});
const db = require('../config/supabase');
const repo = require('../repositories/propertyRepository');
beforeEach(() => {
    db.property = { id: 'property-1', seller_id: 'seller-1', status: 'pending', payment_status: 'Unpaid' };
    db.writes = [];
    db.writeError = null;
});
test('existing atomic property helper preserves pending-review behavior', async () => {
    await repo.markListingPaidOnce('property-1');
    expect(db.property).toMatchObject({ status: 'pending', payment_status: 'Paid' });
});
test.each(['approved', 'rejected', 'pending'])('existing property guard never changes %s moderation', async status => {
    db.property.status = status;
    await repo.markListingPaidOnce('property-1');
    expect(db.property.status).toBe(status);
    expect(db.writes).toEqual([{ payment_status: 'Paid' }]);
});
test('existing property guard skips repeated payment transitions', async () => {
    db.property.payment_status = 'Paid';
    expect(await repo.markListingPaidOnce('property-1')).toBeNull();
    expect(db.writes).toEqual([]);
});
test('existing property guard propagates database failure', async () => {
    db.writeError = new Error('Database unavailable');
    await expect(repo.markListingPaidOnce('property-1')).rejects.toThrow('Database unavailable');
    expect(db.property.payment_status).toBe('Unpaid');
});
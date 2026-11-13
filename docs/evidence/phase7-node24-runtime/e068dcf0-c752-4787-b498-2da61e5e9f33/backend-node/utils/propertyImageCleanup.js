const defaultLogger = require('./logger');
const PUBLIC_PROPERTIES_PREFIX = '/storage/v1/object/public/properties/';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function configuredOrigin(value) {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash
        || !['', '/'].includes(url.pathname)) throw new Error('Invalid configured Storage origin.');
    return url.origin;
}

// Validate the original spelling before URL can normalize dot segments or backslashes.
function managedPropertyPath(value, sellerId, supabaseUrl) {
    if (typeof value !== 'string' || !UUID.test(sellerId) || /[\\\x00-\x20\x7f]/.test(value)) return null;
    try {
        const origin = configuredOrigin(supabaseUrl);
        const rawPath = /^https?:\/\/[^/?#]+(\/[^?#]*)$/.exec(value)?.[1];
        if (!rawPath?.startsWith(PUBLIC_PROPERTIES_PREFIX)) return null;
        const url = new URL(value);
        if (url.origin !== origin || url.username || url.password || url.search || url.hash) return null;
        const parts = rawPath.slice(PUBLIC_PROPERTIES_PREFIX.length).split('/').map(part => decodeURIComponent(part));
        if (parts.length < 2 || parts[0] !== sellerId || parts.some(part => !part || part === '.' || part === '..'
            || /[\\/%\x00-\x1f\x7f]/.test(part))) return null;
        return parts.join('/');
    } catch { return null; }
}

function references(row) {
    const values = [];
    if (Array.isArray(row.images)) values.push(...row.images);
    else if (row.images != null) values.push(row.images);
    if (Array.isArray(row.virtual_tours)) values.push(...row.virtual_tours.map(tour => tour?.url));
    else if (row.virtual_tours != null) values.push(undefined);
    return values;
}

async function cleanupPropertyImages(client, listing, { supabaseUrl = process.env.SUPABASE_URL,
    logger = defaultLogger, pageSize = 500 } = {}) {
    const candidates = new Set();
    let skippedReferenceCount = 0;
    for (const value of references(listing)) {
        const path = managedPropertyPath(value, listing.seller_id, supabaseUrl);
        if (path) candidates.add(path);
        else skippedReferenceCount++;
    }
    if (skippedReferenceCount) logger.warn('Property image cleanup skipped unmanaged references.', { event: 'property_image_cleanup_skipped_references',
        listingId: listing.id, sellerId: listing.seller_id, skippedReferenceCount });
    if (!candidates.size) return;

    let stage = 'reference_lookup';
    let managedPaths = [...candidates];
    try {
        if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Invalid reference page size.');
        const referenced = new Set();
        let offset = 0;
        // Continue until an empty page, including when the server caps pages below our requested size.
        for (;;) {
            const { data, error } = await client.from('properties').select('id,images,virtual_tours')
                .order('id', { ascending: true }).range(offset, offset + pageSize - 1);
            if (error || !Array.isArray(data)) throw new Error('Reference lookup failed.');
            if (!data.length) break;
            for (const row of data) {
                for (const value of references(row)) {
                    const path = managedPropertyPath(value, listing.seller_id, supabaseUrl);
                    if (path && candidates.has(path)) referenced.add(path);
                }
            }
            offset += data.length;
        }
        managedPaths = managedPaths.filter(path => !referenced.has(path));
        if (!managedPaths.length) return;
        stage = 'storage_remove';
        const { error } = await client.storage.from('properties').remove(managedPaths);
        if (error) throw new Error('Storage removal failed.');
    } catch {
        // DB deletion has committed. These exact managed paths support manual recovery; this is not a durable job.
        logger.error('Property image cleanup requires recovery after database deletion.', { event: 'property_image_cleanup_recovery_required', stage,
            listingId: listing.id, sellerId: listing.seller_id, managedPaths });
        throw new Error('Listing image cleanup failed after database deletion.');
    }
}

module.exports = { cleanupPropertyImages, managedPropertyPath };

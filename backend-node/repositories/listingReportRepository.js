const db = require('../config/supabase');

const submit = async ({ propertyId, category, reason }, reporterId) => {
    const { data, error } = await db.rpc('submit_listing_report', { p_property_id: propertyId, p_reporter_id: reporterId, p_category: category, p_reason: reason });
    if (error) throw error;
    if (!data?.id) throw new Error('Report persistence was not confirmed');
    return data;
};
const list = async ({ page, limit, status, search, from, to }) => {
    let query = db.from('listing_reports').select('id,property_id,reporter_id,category,reason,status,created_at,resolved_at,resolved_by,resolution_note,property:properties!inner(id,title,status,deleted_at,city,district),reporter:users!listing_reports_reporter_id_fkey(id,name,email)', { count: 'exact' });
    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.ilike('property.title', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
    if (from) query = query.gte('created_at', `${from}T00:00:00+05:30`);
    if (to) query = query.lt('created_at', new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86400000).toISOString());
    const { data, error, count } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return { reports: (data || []).map(row => ({ ...row, property: Array.isArray(row.property) ? row.property[0] : row.property, reporter: Array.isArray(row.reporter) ? row.reporter[0] : row.reporter })), total: count, page, limit };
};
const resolve = async (id, actorId, { action, note }) => {
    const { data, error } = await db.rpc('resolve_listing_report', { p_report_id: id, p_actor_id: actorId, p_action: action, p_note: note });
    if (error) throw error;
    if (!data?.id || data.status === 'open') throw new Error('Report resolution was not confirmed');
    return data;
};
module.exports = { submit, list, resolve };

const supabase = require('../config/supabase');

async function record(eventId, district) {
    const { error } = await supabase.rpc('record_district_search', { p_event_id: eventId, p_district: district }).abortSignal(AbortSignal.timeout(800));
    if (error) throw error;
}

async function aggregate(window) {
    // Aggregate inside Postgres: a 366-day read can exceed the REST row limit.
    const { data, error } = await supabase.rpc('get_district_search_demand', { p_from: window.from, p_to: window.to });
    if (error) throw error;
    return data;
}
module.exports = { record, aggregate };

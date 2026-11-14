const db = require('../config/supabase');
const rpc = async (name, args) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw error;
    if (data == null) throw new Error('Promotion query returned no confirmed result.');
    return data;
};
exports.list = ({ page, limit, search, enabled }) => rpc('admin_list_promotions', { p_page: page, p_limit: limit, p_search: search, p_enabled: enabled });
exports.setEnabled = (id, enabled, actorId) => rpc('admin_set_promotion', { p_property_id: id, p_enabled: enabled, p_actor_id: actorId });
exports.featured = limit => rpc('public_featured_properties', { p_limit: limit });

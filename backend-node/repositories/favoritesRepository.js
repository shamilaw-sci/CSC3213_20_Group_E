const supabase = require('../config/supabase');

const findFavorite = async (userId, propertyId) => {
    const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .maybeSingle();
    return { data, error };
};

const deleteFavorite = async (userId, propertyId) => {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);
    if (error) throw error;
};

const insertFavorite = async (userId, propertyId) => {
    const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, property_id: propertyId }]);
    if (error) throw error;
};

const getUserFavorites = async (userId) => {
    const { data, error } = await supabase
        .from('favorites')
        .select('property_id, properties!inner(*)')
        .eq('user_id', userId)
        .eq('properties.status', 'approved').is('properties.deleted_at', null);
    return { data, error };
};

module.exports = {
    findFavorite,
    deleteFavorite,
    insertFavorite,
    getUserFavorites
};

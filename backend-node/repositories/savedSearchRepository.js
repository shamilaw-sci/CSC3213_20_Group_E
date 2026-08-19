const supabase = require('../config/supabase');

const insertSavedSearch = async (searchData) => {
    const { data, error } = await supabase
        .from('saved_searches')
        .insert([searchData])
        .select();
    return { data, error };
};

const getSavedSearchesByUser = async (userId) => {
    const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
};

const deleteSavedSearchById = async (id, userId) => {
    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
};

module.exports = {
    insertSavedSearch,
    getSavedSearchesByUser,
    deleteSavedSearchById
};

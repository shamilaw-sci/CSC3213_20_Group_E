const supabase = require('../config/supabase');

const updatePaymentStatus = async (id, payment_status, status) => {
    const { data, error } = await supabase
        .from('properties')
        .update({ payment_status, status })
        .eq('id', id)
        .select('seller_id, title')
        .single();
    if (error) throw error;
    return data;
};

const getApprovedPropertiesForAI = async () => {
    const { data, error } = await supabase
        .from('properties')
        .select('id, title, description, price, type, bedrooms, bathrooms, land_size, district, city, images')
        .eq('status', 'approved');
    if (error) throw error;
    return data;
};

module.exports = {
    getApprovedPropertiesForAI,
    updatePaymentStatus
};

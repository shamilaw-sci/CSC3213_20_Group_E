const db = require('../config/supabase');
const rpc = async (name, args) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw error;
    return data;
};
module.exports = {
    create: terms => rpc('create_listing_checkout', {
        p_property_id: terms.property_id, p_owner_id: terms.owner_id, p_amount: terms.amount,
        p_currency: terms.currency, p_mode: terms.mode, p_merchant_id: terms.merchant_id,
    }),
    find: async id => {
        const { data, error } = await db.from('payment_orders').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
    },
    settle: terms => rpc('settle_listing_checkout', {
        p_order_id: terms.order_id, p_payment_id: terms.payment_id, p_amount: terms.amount,
        p_currency: terms.currency, p_mode: terms.mode, p_merchant_id: terms.merchant_id,
    }),
};

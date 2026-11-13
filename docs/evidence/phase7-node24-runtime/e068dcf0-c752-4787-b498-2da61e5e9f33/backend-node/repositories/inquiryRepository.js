const supabase = require('../config/supabase');

exports.create = async (inquiry) => {
    const { data, error } = await supabase.from('contact_inquiries').insert(inquiry).select('id').single();
    if (error) throw error;
    return data;
};

exports.list = async (from, to) => {
    const { data, count, error } = await supabase.from('contact_inquiries')
        .select('id, first_name, last_name, email, message, created_at', { count: 'exact' })
        .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data, count };
};

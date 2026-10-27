const supabase = require('../config/supabase');

const findByEmail = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, phone, avatar_url, theme_preference, email_notifications')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

const findFullUserById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

const createUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select('id, name, email, role, phone, avatar_url, theme_preference, email_notifications, created_at');
    if (error) throw error;
    return data;
};

const createAgentProfile = async (profileData) => {
    const { error } = await supabase
        .from('agent_profiles')
        .insert([profileData]);
    if (error) throw error;
};

const updateProfile = async (id, updates) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, name, email, role, phone, avatar_url, theme_preference, email_notifications')
        .single();
    return { data, error };
};

const uploadAvatar = async (fileName, buffer, mimeType) => {
    const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
        });
    if (error) throw error;
    
    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
    return data.publicUrl;
};

// Compare-and-set prevents two simultaneous uses of the same reset link.
const resetPasswordOnce = async (id, previousHash, passwordHash) => {
    const { data, error } = await supabase.from('users')
        .update({ password_hash: passwordHash })
        .eq('id', id).eq('password_hash', previousHash)
        .select('id').maybeSingle();
    if (error) throw error;
    return data;
};

const getAgentsForAI = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role, agent_profiles(service_areas, agency_name)')
        .in('role', ['AGENT', 'SELLER']);
    return { data, error };
};

module.exports = {
    getAgentsForAI,
    findByEmail,
    findById,
    findFullUserById,
    createUser,
    createAgentProfile,
    updateProfile,
    resetPasswordOnce,
    uploadAvatar
};

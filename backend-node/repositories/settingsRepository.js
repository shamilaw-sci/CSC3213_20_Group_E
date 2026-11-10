const supabase = require('../config/supabase');

const getSettingValue = async (key, fallback) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', key)
        .maybeSingle();
    if (error) throw error;
    if (data === null) return fallback;
    if (!data || Array.isArray(data) || data.setting_key !== key || typeof data.setting_value !== 'string') {
        throw new Error('Setting read unconfirmed.');
    }
    return data.setting_value;
};

module.exports = {
    getSettingValue
};

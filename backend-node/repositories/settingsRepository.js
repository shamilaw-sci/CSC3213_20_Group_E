const supabase = require('../config/supabase');

const getSettingValue = async (key, fallback) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();
    if (error || !data) return fallback;
    return data.setting_value;
};

module.exports = {
    getSettingValue
};

const supabase = require('../config/supabase');

const getRoleUpgradeStatus = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('role_requests')
            .select('id, status').eq('user_id', req.user.id)
            .eq('requested_role', 'SELLER')
            .order('created_at', { ascending: false }).order('id', { ascending: false })
            .limit(1).maybeSingle();
        if (error) throw error;
        res.json({ request: data || null });
    } catch {
        next(new Error('Unable to load seller request status.'));
    }
};

module.exports = { getRoleUpgradeStatus };

const db = require('../config/supabase');

// Record successful authenticated Admin mutations; never store request bodies or tokens.
module.exports = (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const send = res.json.bind(res);
    res.json = body => {
        if (res.statusCode < 200 || res.statusCode >= 300) return send(body);
        res.json = send;
        const route = req.route?.path || req.path;
        const actions = {
            '/users/:id/ban': 'USER_BANNED', '/users/:id/unban': 'USER_UNBANNED',
            '/users/:id/role': 'USER_ROLE_UPDATED', '/listings/:id/approve': 'LISTING_APPROVED',
            '/listings/:id/reject': 'LISTING_REJECTED', '/listings/:id': 'LISTING_REMOVED',
            '/settings': 'SETTINGS_UPDATED', '/boosts/:id': 'PROPERTY_PROMOTION_UPDATED',
            '/reported/:id/resolve': 'LISTING_REPORT_RESOLVED'
        };
        const action = actions[route] || `${req.method} ${route}`;
        const entry = {
            actor_id: req.user.id, actor: req.user.name || req.user.id,
            action, target: `${route === '/boosts/:id' ? 'property' : route.split('/')[1] || 'admin'}:${req.params.id || 'platform'}`,
            ip: req.ip || '', severity: /BANNED|REJECTED|REMOVED/.test(action) ? 'warning' : 'success'
        };
        const record = async () => {
            try {
                const result = await db.from('admin_audit_events').insert(entry).select('id').single();
                if (result.error || !result.data?.id) throw new Error('Audit write unconfirmed');
                return send(body);
            } catch {
                console.error('admin_audit_write_failed');
                return send({ ...body, warning: [body?.warning, 'Action completed, but audit recording failed. Do not repeat the action; contact support.'].filter(Boolean).join(' ') });
            }
        };
        void record().catch(next);
        return res;
    };
    next();
};

const adminRepository = require('../../repositories/adminRepository');

// ── Role Upgrade Request Controllers ─────────────────────────────────────────

const getRoleRequests = async(req, res, next) => {
    try {
        const { status } = req.query; // optional filter: pending | approved | rejected
        const requests = await adminRepository.getRoleRequests(status || 'pending');
        res.status(200).json({ requests });
    } catch (error) {
        next(error);
    }
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const resolutionErrors = new Map([
    ['P7001', [404, 'Role request not found']],
    ['P7002', [400, 'Request already resolved']],
    ['P7003', [409, 'Role request cannot be resolved in its current state']],
    ['P7004', [409, 'Role request cannot be resolved in its current state']],
    ['23505', [409, 'Role request cannot be resolved in its current state']]
]);

const resolveRequest = async(req, res, next, decision) => {
    const id = req.params?.id;
    if (typeof id !== 'string' || !uuidPattern.test(id)) {
        return res.status(400).json({ message: 'Invalid role request ID' });
    }
    const requestId = id.toLowerCase();
    try {
        const result = await adminRepository.resolveSellerRoleRequest(requestId, decision);
        if (result?.error) {
            const failure = resolutionErrors.get(result.error.code);
            if (failure) return res.status(failure[0]).json({ message: failure[1] });
            throw new Error('Unconfirmed role request resolution');
        }
        const rows = result?.data;
        const row = Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
        if (!row || row.request_id !== requestId || row.decision !== decision
            || typeof row.user_id !== 'string' || !uuidPattern.test(row.user_id)) {
            throw new Error('Unconfirmed role request resolution');
        }

        return res.status(200).json({ message: decision === 'approved'
            ? 'User upgraded to SELLER successfully' : 'Role request rejected' });
    } catch {
        // Do not forward provider messages, details, causes or arbitrary status codes.
        return next(new Error('Role request resolution unavailable.'));
    }
};

const approveRoleRequest = (req, res, next) => resolveRequest(req, res, next, 'approved');
const rejectRoleRequest = (req, res, next) => resolveRequest(req, res, next, 'rejected');

module.exports = { getRoleRequests, approveRoleRequest, rejectRoleRequest };

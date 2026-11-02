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

const approveRoleRequest = async(req, res, next) => {
    try {
        const request = await adminRepository.getRoleRequestById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Role request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

        // Change the user's actual role
        await adminRepository.updateUserRole(request.user_id, request.requested_role, null);
        // Mark request resolved
        await adminRepository.resolveRoleRequest(req.params.id, 'approved');

        res.status(200).json({ message: `User upgraded to ${request.requested_role} successfully` });
    } catch (error) {
        next(error);
    }
};

const rejectRoleRequest = async(req, res, next) => {
    try {
        const request = await adminRepository.getRoleRequestById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Role request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

        await adminRepository.resolveRoleRequest(req.params.id, 'rejected');
        res.status(200).json({ message: 'Role request rejected' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getRoleRequests, approveRoleRequest, rejectRoleRequest };

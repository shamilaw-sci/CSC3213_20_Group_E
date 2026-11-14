const adminRepository = require('../../repositories/adminRepository');
const { sendAgentRejectionEmail } = require('../../utils/emailService');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validTarget = (req, res) => {
    if (typeof req.params.id === 'string' && uuid.test(req.params.id)) return true;
    res.status(400).json({ message: 'Invalid user ID.' });
    return false;
};

const getUsers = async(req, res, next) => {
    try {
        const users = await adminRepository.getUsers(req.query.role);
        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

const getPendingAgents = async(req, res, next) => {
    try {
        const agents = await adminRepository.getPendingAgents();
        res.status(200).json({ agents });
    } catch (error) {
        next(error);
    }
};

const getUserById = async(req, res, next) => {
    try {
        const user = await adminRepository.getUserById(req.params.id);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

const banUser = async(req, res, next) => {
    try {
        if (!validTarget(req, res)) return;
        await adminRepository.updateUserRole(req.params.id, 'BANNED', null);
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        next(error);
    }
};

const unbanUser = async(req, res, next) => {
    try {
        if (!validTarget(req, res)) return;
        const user = await adminRepository.restoreBannedUserRole(req.params.id);
        res.status(200).json({ message: 'User unbanned successfully', role: user.role });
    } catch (error) {
        if (error.code === 'PZ002') return res.status(409).json({ message: 'Previous role is unavailable for this older ban. Administrator review is required; no role was changed.' });
        next(error);
    }
};

const updateUserRole = async(req, res, next) => {
    try {
        if (!validTarget(req, res)) return;
        const { role, reason } = req.body || {};
        if (!['BUYER', 'SELLER', 'ADMIN', 'BANNED', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        if (reason != null && (typeof reason !== 'string' || reason.length > 2000)) {
            return res.status(400).json({ message: 'Invalid rejection reason.' });
        }
        const normalizedReason = typeof reason === 'string' ? reason.trim() || null : null;
        if (role === 'REJECTED_AGENT' && !normalizedReason) {
            return res.status(400).json({ message: 'A rejection reason is required.' });
        }
        await adminRepository.updateUserRole(req.params.id, role, normalizedReason);
        if (role === 'REJECTED_AGENT') {
            try {
                const applicant = await adminRepository.getUserById(req.params.id);
                if (!applicant?.email) throw new Error('Applicant email unavailable');
                await sendAgentRejectionEmail(applicant.email, applicant.name, normalizedReason);
            } catch {
                console.error('agent_rejection_email_failed');
                return res.status(200).json({
                    message: `User role updated to ${role}`,
                    warning: 'Application rejected, but the rejection email could not be delivered. The applicant can view the reason in their profile.'
                });
            }
        }
        res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
        console.error('admin_role_update_failed');
        next(error);
    }
};

module.exports = { getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole };

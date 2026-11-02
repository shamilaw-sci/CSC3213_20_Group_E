const adminRepository = require('../../repositories/adminRepository');

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
        await adminRepository.updateUserRole(req.params.id, 'BANNED', null);
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        next(error);
    }
};

const unbanUser = async(req, res, next) => {
    try {
        await adminRepository.updateUserRole(req.params.id, 'BUYER', null);
        res.status(200).json({ message: "User unbanned successfully" });
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async(req, res, next) => {
    try {
        const { role, reason } = req.body;
        if (!['BUYER', 'SELLER', 'ADMIN', 'BANNED', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        await adminRepository.updateUserRole(req.params.id, role, reason);
        res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
        console.error("updateUserRole error:", error);
        next(error);
    }
};

module.exports = { getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole };

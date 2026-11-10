const agentRepository = require('../../repositories/agentRepository');

// Get Appointments booked by current Buyer
const getMyAppointments = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (typeof userId !== 'string' || !userId.trim()) return res.status(401).json({ message: 'Authentication required' });

        const appointments = await agentRepository.getBuyerAppointments(userId);
        res.status(200).json({ appointments });
    } catch (error) {
        next(error);
    }
};

// Cancel / Delete Appointment (Buyer)
const cancelBuyerAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (typeof userId !== 'string' || !userId.trim()) return res.status(401).json({ message: 'Authentication required' });
        const success = await agentRepository.deleteBuyerAppointment(id, userId);
        
        if (!success) {
            return res.status(404).json({ message: "Appointment not found or already cancelled" });
        }

        res.status(200).json({ message: "Scheduled appointment cancelled successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyAppointments, cancelBuyerAppointment };

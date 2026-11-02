const agentRepository = require('../../repositories/agentRepository');

// Get Appointments booked by current Buyer
const getMyAppointments = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const userId = req.user.id;

        const appointments = await agentRepository.getBuyerAppointments(userEmail, userId);
        res.status(200).json({ appointments });
    } catch (error) {
        next(error);
    }
};

// Cancel / Delete Appointment (Buyer)
const cancelBuyerAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await agentRepository.deleteBuyerAppointment(id, req.user.email);
        
        if (!success) {
            return res.status(404).json({ message: "Appointment not found or already cancelled" });
        }

        res.status(200).json({ message: "Scheduled appointment cancelled successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyAppointments, cancelBuyerAppointment };

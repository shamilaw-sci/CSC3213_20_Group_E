const agentRepository = require('../../repositories/agentRepository');
const supabase = require('../../config/supabase');

// Post a review for an agent
const postReview = async (req, res, next) => {
    try {
        const { id } = req.params; // Agent ID
        const { rating, comment } = req.body;
        const reviewer_id = req.user.id;

        if (reviewer_id === id) {
            return res.status(400).json({ message: "You cannot review your own profile." });
        }

        if (req.user.role !== 'BUYER' && req.user.role !== 'SELLER') {
            return res.status(403).json({ message: "Only buyers and sellers can leave reviews for agents." });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const review = await agentRepository.postReview(id, reviewer_id, rating, comment);
        res.status(201).json({ message: "Review posted successfully", review });
    } catch (error) {
        next(error);
    }
};

// Book a site viewing or consultation with an agent
const bookViewing = async (req, res, next) => {
    try {
        const { id } = req.params; // Agent ID
        const { client_name, client_email, client_phone, property_id, viewing_type, preferred_date, preferred_time, notes } = req.body;

        if (req.user && req.user.id === id) {
            return res.status(400).json({ message: "You cannot book a viewing or consultation with yourself." });
        }

        const lead = await agentRepository.createViewingLead(id, {
            client_name,
            client_email,
            client_phone,
            property_id,
            viewing_type,
            preferred_date,
            preferred_time,
            notes
        });

        // Only a verified session may create a conversation in an account's name.
        // Guest contact details remain on the lead without identifying an account.
        try {
            const buyerId = req.user?.id;

            if (buyerId && buyerId !== id) {
                // Find or create conversation
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('buyer_id', buyerId)
                    .eq('seller_id', id)
                    .maybeSingle();

                let convId = existingConv?.id;
                if (!convId) {
                    const { data: newConv } = await supabase
                        .from('conversations')
                        .insert([{
                            buyer_id: buyerId,
                            seller_id: id,
                            type: 'agent',
                            property_id: property_id || null,
                            lead_status: 'Showing'
                        }])
                        .select()
                        .single();
                    convId = newConv?.id;
                }

                if (convId) {
                    await supabase.from('messages').insert([{
                        conversation_id: convId,
                        sender_id: buyerId,
                        body: `📅 Appointment Request: ${viewing_type || 'Property Tour'} on ${preferred_date || 'Upcoming'} (${preferred_time || 'Flexible'})\nContact: ${client_phone || 'Provided in booking'}\nNotes: ${notes || 'Looking forward to meeting.'}`
                    }]);
                }
            }
        } catch (convErr) {
            console.error("Conversation link error on booking (non-fatal):", convErr);
        }

        res.status(201).json({
            message: "Viewing & consultation request sent successfully! The agent will reach out shortly.",
            lead
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { postReview, bookViewing };

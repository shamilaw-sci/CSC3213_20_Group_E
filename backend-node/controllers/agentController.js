const agentRepository = require('../repositories/agentRepository');
const supabase = require('../config/supabase');

// Get a list of agents
const getAgents = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const rawAgents = await agentRepository.getAgents(limit ? parseInt(limit) : null);
        
        const agents = (rawAgents || []).map(agent => {
            const reviews = agent.agent_reviews || [];
            const review_count = reviews.length;
            const avg_rating = review_count > 0 
                ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / review_count).toFixed(1)
                : "5.0";
            
            const profile = Array.isArray(agent.agent_profiles) 
                ? (agent.agent_profiles[0] || {}) 
                : (agent.agent_profiles || {});

            return {
                ...agent,
                agent_profiles: [profile],
                profile,
                average_rating: parseFloat(avg_rating) || 5.0,
                review_count
            };
        });

        res.status(200).json({ agents });
    } catch (error) {
        next(error);
    }
};

// Get a single agent profile
const getAgentProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const agent = await agentRepository.getAgentProfile(id);

        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }
        
        // Filter out unapproved properties safely in memory
        if (agent.properties) {
            agent.properties = agent.properties.filter(p => p.status === 'approved');
        }

        res.status(200).json({ agent });
    } catch (error) {
        next(error);
    }
};

// Post a review for an agent
const postReview = async (req, res, next) => {
    try {
        const { id } = req.params; // Agent ID
        const { rating, comment } = req.body;
        const reviewer_id = req.user.id;

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

        // Also check if buyer user exists in database to create/link conversation
        try {
            let buyerId = req.user?.id;
            if (!buyerId && client_email) {
                const { data: userRow } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', client_email)
                    .maybeSingle();
                buyerId = userRow?.id;
            }

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

// Get CRM Leads for an Agent
const getAgentLeads = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access the CRM" });
        }

        const data = await agentRepository.getAgentLeads(req.user.id);

        // Fetch the last message for each conversation
        const enrichedLeads = await Promise.all(data.map(async (lead) => {
            const lastMessage = await agentRepository.getLastMessage(lead.id);
            return {
                ...lead,
                last_message: lastMessage
            };
        }));

        res.status(200).json({ leads: enrichedLeads });
    } catch (error) {
        next(error);
    }
};

// Update Lead CRM Metadata
const updateLeadMetadata = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can update CRM leads" });
        }

        const { id } = req.params;
        const { lead_status, timeframe, pre_approved } = req.body;

        const lead = await agentRepository.updateLeadMetadata(id, req.user.id, lead_status, timeframe, pre_approved);
        res.status(200).json({ message: "Lead updated successfully", lead });
    } catch (error) {
        next(error);
    }
};

// Delete / Archive Lead (Agent CRM)
const deleteLead = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can delete CRM leads" });
        }

        const { id } = req.params;
        const success = await agentRepository.deleteAgentLead(id, req.user.id);
        
        if (!success) {
            return res.status(404).json({ message: "Lead not found or already removed" });
        }

        res.status(200).json({ message: "Lead removed from CRM pipeline successfully" });
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

// Update agent profile
const updateAgentProfile = async (req, res, next) => {
    try {
        const { 
            name,
            avatar_url,
            cover_image_url,
            bio, 
            youtube_video_url, 
            languages, 
            agency_name, 
            license_number, 
            service_areas, 
            specialization, 
            total_sales, 
            total_rentals 
        } = req.body;
        const agentId = req.user.id;

        // Only approved AGENT role can update active public agent profiles (M9 fix)
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only verified and approved agents can update public agent profiles." });
        }

        // If avatar_url or name is updated, update the user record
        if (avatar_url !== undefined || name !== undefined) {
            const userUpdates = {};
            if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;
            if (name !== undefined) userUpdates.name = name;
            await supabase.from('users').update(userUpdates).eq('id', agentId);
        }

        const updates = {
            agency_name,
            license_number,
            bio,
            languages: Array.isArray(languages) ? languages.join(',') : languages,
            youtube_video_url,
            cover_image_url,
            service_areas: Array.isArray(service_areas) ? service_areas.join(',') : service_areas,
            specialization,
            total_sales: total_sales !== undefined ? Number(total_sales) : undefined,
            total_rentals: total_rentals !== undefined ? Number(total_rentals) : undefined,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const profile = await agentRepository.updateAgentProfile(agentId, updates);
        res.status(200).json({ message: "Agent profile updated successfully", profile });
    } catch (error) {
        next(error);
    }
};

// Resubmit application after rejection
const resubmitApplication = async (req, res, next) => {
    try {
        const agentId = req.user.id;
        
        if (req.user.role !== 'REJECTED_AGENT') {
            return res.status(403).json({ message: "Only rejected agents can resubmit applications" });
        }

        const { agency_name, license_number, bio } = req.body;
        
        const profileUpdates = {
            agency_name,
            license_number,
            bio,
            rejection_reason: null, // Clear reason
            updated_at: new Date().toISOString()
        };

        await agentRepository.resubmitApplication(agentId, profileUpdates);
        res.status(200).json({ message: "Application resubmitted successfully. Please wait for admin approval." });
    } catch (error) {
        next(error);
    }
};

// Get Dashboard Stats for Agent
const getDashboardStats = async (req, res, next) => {
    try {
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only approved agents can access dashboard stats" });
        }

        const agentId = req.user.id;

        // 1. Get all agent properties
        const { data: properties, error: propsError } = await supabase
            .from('properties')
            .select('id, title, price, status, views_count, images, city, district, created_at, type, listing_type, bedrooms, bathrooms')
            .eq('seller_id', agentId)
            .order('created_at', { ascending: false });

        if (propsError) throw propsError;

        const allProps = properties || [];
        const activeListings = allProps.filter(p => p.status === 'approved');
        const pendingListings = allProps.filter(p => p.status === 'pending');
        const totalPortfolioValue = allProps.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        const totalImpressions = allProps.reduce((sum, p) => sum + (Number(p.views_count) || 0), 0);

        // 2. Get leads from conversations
        const leads = await agentRepository.getAgentLeads(agentId);
        const allLeads = leads || [];
        const totalLeads = allLeads.length;
        const closedLeads = allLeads.filter(l => l.lead_status === 'Closed').length;
        const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

        const pipeline = {
            'New': allLeads.filter(l => !l.lead_status || l.lead_status === 'New').length,
            'Contacted': allLeads.filter(l => l.lead_status === 'Contacted').length,
            'Showing': allLeads.filter(l => l.lead_status === 'Showing').length,
            'Offer': allLeads.filter(l => l.lead_status === 'Offer').length,
            'Closed': closedLeads
        };

        // 3. Get reviews & ratings
        const { data: reviews } = await supabase
            .from('agent_reviews')
            .select('rating, comment, created_at')
            .eq('agent_id', agentId);
        
        const reviewCount = (reviews || []).length;
        const avgRating = reviewCount > 0 
            ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviewCount).toFixed(1)
            : "5.0";

        // 4. Get Agent Profile branding
        const { data: profile } = await supabase
            .from('agent_profiles')
            .select('agency_name, license_number, specialization, total_sales, total_rentals, cover_image_url')
            .eq('agent_id', agentId)
            .maybeSingle();

        // 5. Build recent activity timeline based on real data
        const recentActivity = [
            ...allProps.slice(0, 3).map(p => ({
                type: 'property',
                title: p.title,
                status: p.status,
                time: p.created_at,
                detail: `Rs. ${Number(p.price || 0).toLocaleString()} • ${p.status === 'approved' ? 'Live' : 'Under Review'}`
            })),
            ...allLeads.slice(0, 3).map(l => ({
                type: 'lead',
                title: l.buyer?.name || 'Buyer Inquiry',
                status: l.lead_status || 'New',
                time: l.updated_at || l.created_at,
                detail: `Inquired about ${l.properties?.title || 'Portfolio'}`
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        res.status(200).json({
            stats: {
                activeListings: activeListings.length,
                activeListingsCount: activeListings.length,
                pendingListingsCount: pendingListings.length,
                totalListingsCount: allProps.length,
                totalPortfolioValue,
                totalImpressions,
                totalLeads,
                closedLeads,
                conversionRate,
                avgRating: parseFloat(avgRating) || 5.0,
                reviewCount,
                pipeline,
                profile: profile || {},
                recentActivity
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAgents,
    getAgentProfile,
    postReview,
    bookViewing,
    getMyAppointments,
    getAgentLeads,
    updateLeadMetadata,
    deleteLead,
    cancelBuyerAppointment,
    updateAgentProfile,
    resubmitApplication,
    getDashboardStats
};

const supabase = require('../config/supabase');
const { getBookingSlot, isBookingSlotConflict } = require('../utils/appointmentSlot');
const { publicError } = require('../utils/publicError');
const logger = require('../utils/logger');

const agentRepository = {
    // 1. Get all agents
    getAgents: async (limit) => {
        let query = supabase
            .from('users')
            .select(`
                id, name, avatar_url, role, phone, email,
                agent_profiles (agency_name, specialization, bio, service_areas, license_number, total_sales, total_rentals, youtube_video_url, cover_image_url),
                agent_reviews:agent_reviews!agent_reviews_agent_id_fkey (rating)
            `)
            .eq('role', 'AGENT');

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 2. Get a single agent profile
    getAgentProfile: async (agentId) => {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, name, avatar_url, role, phone, email,
                agent_profiles (agency_name, specialization, bio, service_areas, license_number, total_sales, total_rentals, youtube_video_url, cover_image_url),
                properties (id, title, price, bedrooms, bathrooms, district, city, images, status, type, listing_type),
                agent_reviews:agent_reviews!agent_reviews_agent_id_fkey (id, rating, comment, created_at, reviewer:users!agent_reviews_reviewer_id_fkey(name, avatar_url))
            `)
            .eq('id', agentId)
            .single();
        if (error) throw error;
        return data;
    },

    // 3. Post a review
    postReview: async (agent_id, reviewer_id, rating, comment) => {
        const { data, error } = await supabase
            .from('agent_reviews')
            .insert([{ agent_id, reviewer_id, rating, comment }])
            .select();
        if (error) throw error;
        return data[0];
    },

    // 3.1 Create Viewing / Consultation Lead
    createViewingLead: async (agentId, bookingData, buyerId = null) => {
        if (buyerId !== null && (typeof buyerId !== 'string' || !buyerId.trim())) {
            throw new Error('Valid appointment owner required.');
        }
        const { client_name, client_email, client_phone, property_id, viewing_type, preferred_date, preferred_time, notes } = bookingData;
        const slot = getBookingSlot(bookingData, buyerId !== null);
        const duplicateError = () => publicError(property_id ? 'BOOKING_DUPLICATE' : 'CONSULTATION_DUPLICATE');
        if (buyerId !== null) {
            let query = supabase.from('leads').select('lead_id')
                .eq('buyer_id', buyerId)
                .eq('booking_date', slot.booking_date)
                .eq('booking_time_window', slot.booking_time_window);
            query = property_id ? query.eq('property_id', property_id)
                : query.is('property_id', null).eq('assigned_agent_id', agentId);
            const { data: existing, error: lookupError } = await query.limit(1);
            if (lookupError) throw lookupError;
            if (existing?.length) throw duplicateError();
        }
        
        let leadSource = viewing_type ? `Booking (${viewing_type}): ${preferred_date || 'Flexible'} ${preferred_time || ''}` : 'Direct Profile Booking';
        if (notes && notes.trim()) {
            leadSource += ` • Note: "${notes.trim()}"`;
        }

        const { data, error } = await supabase
            .from('leads')
            .insert([{
                assigned_agent_id: agentId,
                buyer_id: buyerId,
                ...slot,
                property_id: property_id || null,
                client_name,
                client_email,
                client_phone,
                lead_source: leadSource,
                timeframe_to_move: 'ASAP',
                lifecycle_status: 'New'
            }])
            .select();
        
        if (error) {
            if (buyerId !== null && isBookingSlotConflict(error)) throw duplicateError();
            throw error;
        }
        return data ? data[0] : null;
    },

    // 4. Get Agent Leads (Combined Conversations & Direct Leads)
    getAgentLeads: async (agentId) => {
        // Fetch conversations
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select(`
                id, type, property_id, buyer_id, seller_id, created_at, updated_at,
                lead_status, timeframe, pre_approved,
                properties (id, title, images, price),
                buyer:users!buyer_id (id, name, avatar_url, email, phone)
            `)
            .eq('seller_id', agentId)
            .in('type', ['property', 'agent'])
            .order('updated_at', { ascending: false });

        if (convError) throw convError;

        const convIds = (convData || []).map(c => c.id);
        let messagesMap = {};

        if (convIds.length > 0) {
            // Fetch all messages for these conversations in one round trip
            const { data: allMessages, error: msgError } = await supabase
                .from('messages')
                .select('conversation_id, body, created_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            if (!msgError && allMessages) {
                // Group by conversation_id to get the last message
                allMessages.forEach(msg => {
                    if (!messagesMap[msg.conversation_id]) {
                        messagesMap[msg.conversation_id] = msg.body;
                    }
                });
            }
        }

        const convWithMessages = (convData || []).map(conv => ({
            ...conv,
            conversation_id: conv.id,
            notes: messagesMap[conv.id] || null,
            last_message: messagesMap[conv.id] || 'Inquiry conversation opened'
        }));

        // Fetch direct leads from leads table
        const { data: directData, error: directError } = await supabase
            .from('leads')
            .select(`
                lead_id, assigned_agent_id, buyer_id, property_id, client_name, client_email, client_phone,
                lead_source, pre_approval_status, timeframe_to_move, lifecycle_status, created_at, updated_at,
                properties (id, title, images, price)
            `)
            .eq('assigned_agent_id', agentId)
            .order('created_at', { ascending: false });

        if (directError) throw directError;

        const normalizedDirectLeads = (directData || []).map(l => {
            // Map lead_lifecycle to CRM stages: 'New', 'Contacted', 'Showing', 'Offer', 'Closed'
            let status = 'New';
            if (l.lifecycle_status === 'Attempted Contact') status = 'Contacted';
            else if (l.lifecycle_status === 'Active') status = 'Showing';
            else if (l.lifecycle_status === 'Offer') status = 'Offer';
            else if (l.lifecycle_status === 'Closed') status = 'Closed';

            const noteMatch = l.lead_source?.match(/Note:\s*["']?([^"']+)["']?/i);
            const extractedNotes = noteMatch ? noteMatch[1].trim() : null;

            const conversation = l.buyer_id ? convWithMessages.find(c =>
                c.type === 'agent' && c.buyer_id === l.buyer_id && (c.property_id || null) === (l.property_id || null)
            ) : null;
            return {
                id: l.lead_id,
                buyer_id: l.buyer_id,
                conversation_id: conversation?.id || null,
                last_message: conversation?.last_message || null,
                is_direct_booking: true,
                type: 'booking',
                property_id: l.property_id,
                created_at: l.created_at,
                updated_at: l.updated_at,
                lead_status: status,
                timeframe: l.timeframe_to_move || 'ASAP',
                pre_approved: l.pre_approval_status || false,
                lead_source: l.lead_source,
                notes: extractedNotes,
                properties: l.properties,
                buyer: {
                    name: l.client_name,
                    email: l.client_email,
                    phone: l.client_phone,
                    avatar_url: null
                }
            };
        });

        // Combine both
        const linkedConversationIds = new Set(normalizedDirectLeads.map(l => l.conversation_id).filter(Boolean));
        const combined = [...convWithMessages.filter(c => !linkedConversationIds.has(c.id)), ...normalizedDirectLeads];
        combined.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
        return combined;
    },

    // 4.1 Get Appointments for a Buyer
    getBuyerAppointments: async (userId) => {
        if (typeof userId !== 'string' || !userId.trim()) throw new Error('Valid appointment owner required.');
        const query = supabase
            .from('leads')
            .select(`
                lead_id, assigned_agent_id, property_id, client_name, client_email, client_phone,
                lead_source, pre_approval_status, timeframe_to_move, lifecycle_status, created_at, updated_at,
                properties (id, title, images, price, city, district),
                assigned_agent:users!leads_assigned_agent_id_fkey (id, name, avatar_url, phone, email, agent_profiles(agency_name, license_number))
            `)
            .order('created_at', { ascending: false })
            .eq('buyer_id', userId);

        const { data, error } = await query;
        if (error) throw error;
        
        return (data || []).map(l => {
            const noteMatch = l.lead_source?.match(/Note:\s*["']?([^"']+)["']?/i);
            return {
                ...l,
                notes: noteMatch ? noteMatch[1].trim() : null
            };
        });
    },

    // Helper: Get Last Message for a Lead
    getLastMessage: async (conversationId) => {
        const { data } = await supabase
            .from('messages')
            .select('body, created_at, sender_id')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1);
        return data && data.length > 0 ? data[0].body : 'No messages yet';
    },

    // 5. Update Lead Metadata
    updateLeadMetadata: async (id, seller_id, lead_status, timeframe, pre_approved) => {
        // First try updating conversations table
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .update({ lead_status, timeframe, pre_approved })
            .eq('id', id)
            .eq('seller_id', seller_id)
            .select();

        if (conv && conv.length > 0) return conv[0];

        // If not in conversations, try updating leads table
        let lifecycle_status = 'New';
        if (lead_status === 'Contacted') lifecycle_status = 'Attempted Contact';
        else if (lead_status === 'Showing') lifecycle_status = 'Active';
        else if (lead_status === 'Offer') lifecycle_status = 'Offer';
        else if (lead_status === 'Closed') lifecycle_status = 'Closed';

        const updates = { updated_at: new Date().toISOString() };
        if (lead_status !== undefined) updates.lifecycle_status = lifecycle_status;
        if (timeframe !== undefined) updates.timeframe_to_move = timeframe;
        if (pre_approved !== undefined) updates.pre_approval_status = pre_approved;

        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .update(updates)
            .eq('lead_id', id)
            .eq('assigned_agent_id', seller_id)
            .select();

        if (leadError) throw leadError;
        return lead ? lead[0] : null;
    },

    // 5.1 Delete Lead from CRM (Agent)
    deleteAgentLead: async (id, agentId) => {
        // Try deleting from leads table
        const { data: delLead, error: leadErr } = await supabase
            .from('leads')
            .delete()
            .eq('lead_id', id)
            .eq('assigned_agent_id', agentId)
            .select();

        if (delLead && delLead.length > 0) return true;

        // Try deleting from conversations table
        const { data: delConv, error: convErr } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)
            .eq('seller_id', agentId)
            .select();

        return (delConv && delConv.length > 0);
    },

    // 5.2 Cancel / Delete Appointment (Buyer)
    deleteBuyerAppointment: async (leadId, userId) => {
        if (typeof userId !== 'string' || !userId.trim()) throw new Error('Valid appointment owner required.');
        const { data, error } = await supabase
            .from('leads')
            .delete()
            .eq('lead_id', leadId)
            .eq('buyer_id', userId)
            .select();

        if (error) throw error;
        return data && data.length > 0;
    },

    // 6. Update Agent Profile
    updateAgentProfile: async (agentId, updates) => {
        // Check if agent profile row already exists
        const { data: existing, error: lookupError } = await supabase
            .from('agent_profiles')
            .select('agent_id, agency_name')
            .eq('agent_id', agentId)
            .maybeSingle();
        if (lookupError) throw lookupError;

        if (existing) {
            const { data, error } = await supabase
                .from('agent_profiles')
                .update(updates)
                .eq('agent_id', agentId)
                .select();
            if (error) throw error;
            return data ? data[0] : null;
        } else {
            const { data, error } = await supabase
                .from('agent_profiles')
                .insert([{
                    agent_id: agentId,
                    agency_name: updates.agency_name || 'Independent Real Estate Agent',
                    ...updates
                }])
                .select();
            if (error) throw error;
            return data ? data[0] : null;
        }
    },

    // 7. Resubmit Application
    resubmitApplication: async (agentId, profileUpdates) => {
        const { data: profile, error: profileError } = await supabase
            .from('agent_profiles')
            .update(profileUpdates)
            .eq('agent_id', agentId)
            .select('agent_id').single();
        if (profileError) throw profileError;
        if (profile?.agent_id !== agentId) throw new Error('Agent application update could not be confirmed.');

        try {
            const { data: user, error: userError } = await supabase
                .from('users')
                .update({ role: 'PENDING_AGENT', updated_at: new Date().toISOString() })
                .eq('id', agentId).eq('role', 'REJECTED_AGENT')
                .select('id').single();
            if (userError) throw userError;
            if (user?.id !== agentId) throw new Error('Agent application role transition could not be confirmed.');
        } catch (error) {
            logger.error('Agent resubmission requires recovery after profile write.', {
                event: 'agent_resubmission_partial_write', agentId
            });
            throw error;
        }
    },

    // 8. Get Active Listings Count
    getActiveListingsCount: async (agentId) => {
        const { count, error } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', agentId)
            .eq('status', 'approved');
        if (error) throw error;
        return count;
    },

    // 9. Get Leads for Dashboard
    getLeadsForDashboard: async (agentId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('lead_status')
            .eq('seller_id', agentId)
            .in('type', ['property', 'agent']);
        if (error) throw error;
        return data;
    }
};

module.exports = agentRepository;

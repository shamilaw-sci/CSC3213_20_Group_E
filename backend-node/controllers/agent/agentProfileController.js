const agentRepository = require('../../repositories/agentRepository');
const supabase = require('../../config/supabase');
const logger = require('../../utils/logger');

// Update agent profile
const updateAgentProfile = async (req, res, next) => {
    let userUpdated = false;
    try {
        const { 
            name,
            avatar_url,
            cover_image_url,
            cover_position_x,
            cover_position_y,
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

        // Only approved agents can update public agent profiles.
        if (req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Only verified and approved agents can update public agent profiles." });
        }

        // If avatar_url or name is updated, update the user record
        if (avatar_url !== undefined || name !== undefined) {
            const userUpdates = {};
            if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;
            if (name !== undefined) userUpdates.name = name;
            const { data: updatedUser, error: userError } = await supabase.from('users').update(userUpdates)
                .eq('id', agentId).select('id').single();
            if (userError) throw userError;
            if (updatedUser?.id !== agentId) throw new Error('User profile update could not be confirmed.');
            userUpdated = true;
        }

        const updates = {
            agency_name,
            license_number,
            bio,
            languages: Array.isArray(languages) ? languages.join(',') : languages,
            youtube_video_url,
            cover_image_url,
            cover_position_x,
            cover_position_y,
            service_areas: Array.isArray(service_areas) ? service_areas.join(',') : service_areas,
            specialization,
            total_sales: total_sales !== undefined ? Number(total_sales) : undefined,
            total_rentals: total_rentals !== undefined ? Number(total_rentals) : undefined,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const profile = await agentRepository.updateAgentProfile(agentId, updates);
        if (!profile) throw new Error('Agent profile update could not be confirmed.');
        res.status(200).json({ message: "Agent profile updated successfully", profile });
    } catch (error) {
        if (userUpdated) logger.error('Agent profile requires recovery after partial write.', {
            event: 'agent_profile_partial_write', agentId: req.user.id
        });
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

module.exports = { updateAgentProfile, resubmitApplication };

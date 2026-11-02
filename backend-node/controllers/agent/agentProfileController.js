const agentRepository = require('../../repositories/agentRepository');
const supabase = require('../../config/supabase');

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

module.exports = { updateAgentProfile, resubmitApplication };

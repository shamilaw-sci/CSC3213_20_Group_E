const agentRepository = require('../../repositories/agentRepository');
const supabase = require('../../config/supabase');

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
            .select('id, title, price, status, views_count, images, city, district, created_at, type, listing_type, bedrooms, bathrooms').is('deleted_at', null)
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

module.exports = { getDashboardStats };

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const bcrypt = require('bcryptjs');
const { sendListingStatusEmail } = require('../utils/emailService');

// Admin login - Secure implementation against database
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch user from DB where role is ADMIN
        const { data: adminUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', 'ADMIN')
            .single();

        if (error || !adminUser) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        const token = jwt.sign(
            { id: adminUser.id, email: email, role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            admin: { id: adminUser.id, email, name: adminUser.name }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Middleware to verify admin token
const requireAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: "Unauthorized - Admin access required" });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const [
            { count: usersCount },
            { count: propertiesCount },
            { count: activeListingsCount },
            { count: pendingListingsCount },
            { count: rejectedListingsCount },
            { count: buyerCount },
            { count: sellerCount },
            { data: transactions },
            { data: propertiesData }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'BUYER'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'SELLER'),
            supabase.from('transactions').select('amount').eq('status', 'SUCCESS'),
            supabase.from('properties').select('type')
        ]);

        const totalRevenue = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        const typesMap = {};
        (propertiesData || []).forEach(p => {
            const t = p.type || 'Other';
            typesMap[t] = (typesMap[t] || 0) + 1;
        });
        const listingTypes = Object.entries(typesMap).map(([label, value]) => ({ label, value }));

        res.status(200).json({
            totalListings: propertiesCount || 0,
            totalUsers: usersCount || 0,
            totalProperties: propertiesCount || 0,
            activeListings: activeListingsCount || 0,
            pendingApproval: pendingListingsCount || 0,
            rejectedListings: rejectedListingsCount || 0,
            buyerCount: buyerCount || 0,
            sellerCount: sellerCount || 0,
            revenue: totalRevenue,
            listingTypes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get revenue data
const getRevenueData = async (req, res) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('status', 'SUCCESS')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by month (e.g. 'Nov', 'Dec')
        const grouped = {};
        (transactions || []).forEach(tx => {
            if (!tx.created_at) return;
            const date = new Date(tx.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            grouped[month] = (grouped[month] || 0) + Number(tx.amount || 0);
        });

        // Ensure we show at least the last 6 months even if empty
        const months = [];
        const d = new Date();
        d.setMonth(d.getMonth() - 5);
        for (let i = 0; i < 6; i++) {
            const m = d.toLocaleString('default', { month: 'short' });
            months.push(m);
            if (!grouped[m]) grouped[m] = 0;
            d.setMonth(d.getMonth() + 1);
        }

        const formattedData = months.map(m => ({ label: m, value: grouped[m] }));

        res.status(200).json({
            period: req.query.period || 'monthly',
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user growth
const getUserGrowth = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Cumulative sum by month
        const grouped = {};
        let cumulative = 0;
        
        // Count users per month first
        const countsPerMonth = {};
        (users || []).forEach(u => {
            if (!u.created_at) return;
            const monthYear = new Date(u.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
            countsPerMonth[monthYear] = (countsPerMonth[monthYear] || 0) + 1;
        });

        // Generate last 6 months
        const months = [];
        const d = new Date();
        d.setMonth(d.getMonth() - 5);
        
        // Calculate cumulative up to 6 months ago
        (users || []).forEach(u => {
            if (!u.created_at) return;
            if (new Date(u.created_at) < d) {
                cumulative++;
            }
        });

        for (let i = 0; i < 6; i++) {
            const monthStr = d.toLocaleString('default', { month: 'short' });
            const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            cumulative += (countsPerMonth[monthYear] || 0);
            months.push({ label: monthStr, value: cumulative });
            d.setMonth(d.getMonth() + 1);
        }

        res.status(200).json({ data: months });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all listings
const getListings = async (req, res) => {
    try {
        const query = supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (req.query.status) {
            query.eq('status', req.query.status);
        }

        const { data: listings, error } = await query;

        if (error) throw error;

        res.status(200).json({ listings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get listing by ID
const getListingById = async (req, res) => {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (listingError) throw listingError;

        // Manually fetch transactions since a foreign key join might not be configured
        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('property_id', req.params.id);
            
        listing.transactions = txData || [];

        res.status(200).json({ listing });
    } catch (error) {
        console.error("Failed to get listing by ID:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Approve listing
const approveListing = async (req, res) => {
    try {
        const { data: listing, error } = await supabase
            .from('properties')
            .update({ status: 'approved' })
            .eq('id', req.params.id)
            .select('title, seller_id, users(email)')
            .single();

        if (error) throw error;

        if (listing && listing.users && listing.users.email) {
            sendListingStatusEmail(listing.users.email, listing.title, 'Active').catch(console.error);
        }

        res.status(200).json({ message: "Listing approved", listing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject listing
const rejectListing = async (req, res) => {
    try {
        const { reason } = req.body;

        let { data: listing, error } = await supabase
            .from('properties')
            .update({ status: 'rejected', rejection_reason: reason || null })
            .eq('id', req.params.id)
            .select('title, seller_id, users(email)')
            .single();

        if (error && error.message?.includes('rejection_reason')) {
            const fallback = await supabase
                .from('properties')
                .update({ status: 'rejected' })
                .eq('id', req.params.id)
                .select('title, seller_id, users(email)')
                .single();
            listing = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;

        if (listing && listing.users && listing.users.email) {
            sendListingStatusEmail(listing.users.email, listing.title, 'Rejected', reason).catch(console.error);
        }

        res.status(200).json({ message: "Listing rejected", listing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete listing
const deleteListing = async (req, res) => {
    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .limit(50);

        if (error) throw error;

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get pending agents
const getPendingAgents = async (req, res) => {
    try {
        const { data: agents, error } = await supabase
            .from('users')
            .select(`
                id, name, email, role, created_at,
                agent_profiles (agency_name, license_number, bio)
            `)
            .eq('role', 'PENDING_AGENT')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ agents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Ban user (Requires a 'status' or 'is_banned' column in DB, assuming we use a generic update for now, or just reject their login by changing role to BANNED)
const banUser = async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ role: 'BANNED' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unban user (Restore to BUYER or SELLER, defaulting to BUYER here)
const unbanUser = async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ role: 'BUYER' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: "User unbanned successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        // Strict role checking
        if (!['BUYER', 'SELLER', 'ADMIN', 'BANNED', 'AGENT', 'PENDING_AGENT'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get analytics
const getAnalytics = async (req, res) => {
    try {
        res.status(200).json({ analytics: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get search heatmap
const getSearchHeatmap = async (req, res) => {
    try {
        res.status(200).json({ heatmap: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get transactions
const getTransactions = async (req, res) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                id, amount, currency, status, created_at, transaction_id, payment_method, property_id,
                properties(title, users(name))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Export report
const exportReport = async (req, res) => {
    try {
        res.status(200).json({ report: "Report exported" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
    try {
        res.status(200).json({ logs: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get settings
const getSettings = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*');

        if (error) throw error;
        
        // Convert array of {key, value} to an object
        const settings = {};
        if (data) {
            data.forEach(item => {
                settings[item.setting_key] = item.setting_value;
            });
        }
        // Fallback for UI if DB is empty
        if (!settings['listing_fee']) settings['listing_fee'] = '500';

        res.status(200).json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update settings
const updateSettings = async (req, res) => {
    try {
        const { listing_fee } = req.body;
        
        if (listing_fee) {
            const { error } = await supabase
                .from('platform_settings')
                .upsert(
                    { setting_key: 'listing_fee', setting_value: String(listing_fee) },
                    { onConflict: 'setting_key' }
                );
            if (error) throw error;
        }

        res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get boosts
const getBoosts = async (req, res) => {
    try {
        res.status(200).json({ boosts: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle boost
const toggleBoost = async (req, res) => {
    try {
        res.status(200).json({ message: "Boost toggled" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get reported content
const getReportedContent = async (req, res) => {
    try {
        res.status(200).json({ reports: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Resolve report
const resolveReport = async (req, res) => {
    try {
        res.status(200).json({ message: "Report resolved" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    login,
    requireAdmin,
    getDashboardStats,
    getRevenueData,
    getUserGrowth,
    getListings,
    getListingById,
    approveListing,
    rejectListing,
    deleteListing,
    getUsers,
    getPendingAgents,
    getUserById,
    banUser,
    unbanUser,
    updateUserRole,
    getAnalytics,
    getSearchHeatmap,
    getTransactions,
    exportReport,
    getAuditLogs,
    getSettings,
    updateSettings,
    getBoosts,
    toggleBoost,
    getReportedContent,
    resolveReport
};

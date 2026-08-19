const jwt = require('jsonwebtoken');

// Initialize Supabase client
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('./savedSearchController');

// Admin login - Secure implementation against database
const login = async (req, res, next) => {
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
        next(error);
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
const getDashboardStats = async (req, res, next) => {
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
        next(error);
    }
};

// Get revenue data
const getRevenueData = async (req, res, next) => {
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
        next(error);
    }
};

// Get user growth
const getUserGrowth = async (req, res, next) => {
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
        next(error);
    }
};

// Get all listings
const getListings = async (req, res, next) => {
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
        next(error);
    }
};

// Get listing by ID
const getListingById = async (req, res, next) => {
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
        next(error);
    }
};

// Approve listing
const approveListing = async (req, res, next) => {
    try {
        const { data: listing, error } = await supabase
            .from('properties')
            .update({ status: 'approved' })
            .eq('id', req.params.id)
            .select('id, title, type, price, bedrooms, bathrooms, latitude, longitude, seller_id, users(email)')
            .single();

        if (error) throw error;

        if (listing && listing.users && listing.users.email) {
            sendListingStatusEmail(listing.users.email, listing.title, 'Active').catch(console.error);
        }

        // Fire-and-forget: notify anyone with a matching saved search that
        // this newly-live listing matches their criteria. Never blocks the
        // approval response, and never throws (see checkSavedSearchMatches).
        checkSavedSearchMatches(listing).catch(console.error);

        res.status(200).json({ message: "Listing approved", listing });
    } catch (error) {
        next(error);
    }
};

// Reject listing
const rejectListing = async (req, res, next) => {
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
        next(error);
    }
};

// Delete listing
const deleteListing = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Get all users
const getUsers = async (req, res, next) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, name, email, role, created_at,
                properties(id)
            `)
            .limit(50)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to what frontend expects
        const mappedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            joinDate: new Date(u.created_at).toISOString().split('T')[0],
            listings: u.properties ? u.properties.length : 0,
            location: 'N/A', // Assuming we don't have user location in DB yet
            status: u.role === 'BANNED' ? 'Banned' : 'Active'
        }));

        res.status(200).json({ users: mappedUsers });
    } catch (error) {
        next(error);
    }
};

// Get pending agents
const getPendingAgents = async (req, res, next) => {
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
        next(error);
    }
};

// Get user by ID
const getUserById = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// Ban user (Requires a 'status' or 'is_banned' column in DB, assuming we use a generic update for now, or just reject their login by changing role to BANNED)
const banUser = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ role: 'BANNED' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        next(error);
    }
};

// Unban user (Restore to BUYER or SELLER, defaulting to BUYER here)
const unbanUser = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ role: 'BUYER' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: "User unbanned successfully" });
    } catch (error) {
        next(error);
    }
};

// Update user role
const updateUserRole = async (req, res, next) => {
    try {
        const { role, reason } = req.body;
        // Strict role checking
        if (!['BUYER', 'SELLER', 'ADMIN', 'BANNED', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id);

        if (error) throw error;
        
        // Update agent_profiles rejection reason if applicable
        if (role === 'REJECTED_AGENT' && reason) {
            await supabase.from('agent_profiles').update({ rejection_reason: reason }).eq('agent_id', req.params.id);
        } else if (role === 'AGENT') {
            // Clear reason upon approval
            await supabase.from('agent_profiles').update({ rejection_reason: null }).eq('agent_id', req.params.id);
        }

        res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
        console.error("updateUserRole error:", error);
        next(error);
    }
};

// Get analytics
const getAnalytics = async (req, res, next) => {
    try {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true });
        
        res.status(200).json({ 
            analytics: [
                { metric: 'Total Users', value: userCount || 0 },
                { metric: 'Total Properties', value: propertyCount || 0 }
            ] 
        });
    } catch (error) {
        next(error);
    }
};

// Get search heatmap
const getSearchHeatmap = async (req, res, next) => {
    try {
        res.status(200).json({ heatmap: [] });
    } catch (error) {
        next(error);
    }
};

// Get transactions
const getTransactions = async (req, res, next) => {
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
        next(error);
    }
};

// Export report
const exportReport = async (req, res, next) => {
    try {
        const { type } = req.params;
        let dataToExport = [];
        let headers = [];

        if (type === 'transactions') {
            const { data, error } = await supabase.from('transactions').select('*');
            if (error) throw error;
            dataToExport = data || [];
            headers = ['id', 'property_id', 'amount', 'currency', 'status', 'payment_method', 'created_at'];
        } else if (type === 'users') {
            const { data, error } = await supabase.from('users').select('id, name, email, role, created_at');
            if (error) throw error;
            dataToExport = data || [];
            headers = ['id', 'name', 'email', 'role', 'created_at'];
        } else if (type === 'listings') {
            const { data, error } = await supabase.from('properties').select('id, title, price, type, status, created_at');
            if (error) throw error;
            dataToExport = data || [];
            headers = ['id', 'title', 'price', 'type', 'status', 'created_at'];
        } else {
            return res.status(400).json({ message: "Invalid report type" });
        }

        let csvContent = headers.join(',') + '\n';
        dataToExport.forEach(row => {
            const values = headers.map(header => {
                const val = row[header] !== null && row[header] !== undefined ? row[header] : '';
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=thirasara-${type}-report.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

// Get audit logs
const getAuditLogs = async (req, res, next) => {
    try {
        res.status(200).json({ logs: [] });
    } catch (error) {
        next(error);
    }
};

// Get settings
const getSettings = async (req, res, next) => {
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
        next(error);
    }
};

// Update settings
const updateSettings = async (req, res, next) => {
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
        next(error);
    }
};

// Get boosts
const getBoosts = async (req, res, next) => {
    try {
        res.status(200).json({ boosts: [] });
    } catch (error) {
        next(error);
    }
};

// Toggle boost
const toggleBoost = async (req, res, next) => {
    try {
        res.status(200).json({ message: "Boost toggled" });
    } catch (error) {
        next(error);
    }
};

// Get reported content
const getReportedContent = async (req, res, next) => {
    try {
        res.status(200).json({ reports: [] });
    } catch (error) {
        next(error);
    }
};

// Resolve report
const resolveReport = async (req, res, next) => {
    try {
        res.status(200).json({ message: "Report resolved" });
    } catch (error) {
        next(error);
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

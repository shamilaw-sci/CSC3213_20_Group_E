const supabase = require('../config/supabase');

const adminRepository = {
    // 1. Admin Login
    getAdminUserByEmail: async (email) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', 'ADMIN')
            .single();
        return { data, error };
    },

    // 2. Dashboard Stats
    getDashboardStats: async () => {
        return await Promise.all([
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
    },

    // 3. Revenue Data
    getSuccessfulTransactions: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('status', 'SUCCESS')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    // 4. User Growth
    getAllUsersCreatedAt: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('created_at')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    // 5. Get Listings
    getListings: async (statusFilter) => {
        let query = supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (statusFilter) query.eq('status', statusFilter);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 6. Get Listing By ID with Transactions
    getListingByIdWithTransactions: async (id) => {
        const { data: listing, error: listingError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();
        if (listingError) throw listingError;

        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('property_id', id);

        listing.transactions = txData || [];
        return listing;
    },

    // 7. Update Listing Status
    updateListingStatus: async (id, updates) => {
        const { data, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                seller:users!properties_seller_id_fkey(name, email)
            `)
            .single();
        if (error) throw error;
        return data;
    },

    // 8. Delete Listing
    deleteListing: async (id) => {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // 9. Get Users
    getUsers: async (roleFilter) => {
        let query = supabase
            .from('users')
            .select('id, name, email, role, verified, created_at')
            .order('created_at', { ascending: false })
            .limit(100);
            
        if (roleFilter) query.eq('role', roleFilter);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 10. Get Pending Agents
    getPendingAgents: async () => {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, name, email, role, created_at,
                agent_profiles(agency_name, license_number, bio)
            `)
            .eq('role', 'PENDING_AGENT')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // 11. Get User By ID
    getUserById: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, verified, phone, avatar_url, theme_preference, email_notifications, created_at')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // 12. Update User Role
    updateUserRole: async (id, role, reason) => {
        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', id);
        if (error) throw error;

        if (role === 'REJECTED_AGENT' && reason) {
            await supabase.from('agent_profiles').update({ rejection_reason: reason }).eq('agent_id', id);
        } else if (role === 'AGENT') {
            await supabase.from('agent_profiles').update({ rejection_reason: null }).eq('agent_id', id);
        }
    },

    // 13. Get Analytics Counts
    getAnalyticsCounts: async () => {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true });
        return { userCount, propertyCount };
    },

    // 14. Get Transactions Detailed
    getTransactionsDetailed: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                id, amount, currency, status, created_at, transaction_id, payment_method, property_id,
                properties(title, users(name))
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // 15. Export Data
    getExportData: async (type) => {
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
        }

        return { dataToExport, headers };
    },

    // 16. Get Settings
    getPlatformSettings: async () => {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*');
        if (error) throw error;
        return data;
    },

    // 17. Update Setting
    updatePlatformSetting: async (key, value) => {
        const { error } = await supabase
            .from('platform_settings')
            .upsert(
                { setting_key: key, setting_value: String(value) },
                { onConflict: 'setting_key' }
            );
        if (error) throw error;
    }
};

module.exports = adminRepository;

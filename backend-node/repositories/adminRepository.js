const supabase = require('../config/supabase');
const { publicError } = require('../utils/publicError');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sameId = (value, expected) => typeof value === 'string' && uuid.test(value) && value.toLowerCase() === expected.toLowerCase();
const confirmedRequest = (row, userId, role) => row && !Array.isArray(row) && typeof row.id === 'string' && uuid.test(row.id)
    && sameId(row.user_id, userId) && row.requested_role === role && row.status === 'pending';

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

    // 2. Dashboard Stats (Excludes unpaid listings)
    getDashboardStats: async () => {
        return await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('payment_status', 'Paid'),
            supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'approved').eq('payment_status', 'Paid'),
            supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'pending').eq('payment_status', 'Paid'),
            supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'rejected'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'BUYER'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'SELLER'),
            supabase.from('transactions').select('amount').eq('status', 'SUCCESS'),
            supabase.from('properties').select('type').is('deleted_at', null).eq('payment_status', 'Paid')
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

    // 5. Get Listings (Only returns paid listings to admins with seller info)
    getListings: async (statusFilter) => {
        let query = supabase
            .from('properties')
            .select(`
                *,
                seller:users!properties_seller_id_fkey(id, name, email, role, phone)
            `).is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (statusFilter) {
            query.eq('status', statusFilter);
            if (statusFilter === 'pending') {
                query.eq('payment_status', 'Paid');
            }
        } else {
            query.eq('payment_status', 'Paid');
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 6. Get Listing By ID with Transactions and Seller info
    getListingByIdWithTransactions: async (id) => {
        const { data: listing, error: listingError } = await supabase
            .from('properties')
            .select(`
                *,
                seller:users!properties_seller_id_fkey(id, name, email, role, phone)
            `).is('deleted_at', null)
            .eq('id', id)
            .single();
        if (listingError?.code === 'PGRST116') return null;
        if (listingError) throw listingError;

        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('property_id', id)
            .order('created_at', { ascending: false });

        listing.transactions = txData || [];
        return listing;
    },

    // Only the request that changes moderation state should send match alerts.
    approveListingOnce: async (id) => {
        const { data, error } = await supabase.from('properties')
            .update({ status: 'approved', rejection_reason: null }).is('deleted_at', null)
            .eq('id', id).neq('status', 'approved')
            .select('*, seller:users!properties_seller_id_fkey(name, email)').maybeSingle();
        if (error) throw error;
        return data;
    },

    // 7. Update Listing Status
    updateListingStatus: async (id, updates) => {
        const { data, error } = await supabase
            .from('properties')
            .update(updates).is('deleted_at', null)
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
        const { data, error } = await supabase
            .from('properties')
            .update({ deleted_at: new Date().toISOString() }).is('deleted_at', null)
            .eq('id', id)
            .select('id');
        if (error) throw error;
    },

    // 9. Get Users
    getUsers: async (roleFilter) => {
        let query = supabase
            .from('users')
            .select('id, name, email, role, created_at')
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
            .select('id, name, email, role, phone, avatar_url, theme_preference, email_notifications, created_at')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // 12. Update User Role
    updateUserRole: async (id, role, reason) => {
        const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', id)
            .select('id, role')
            .maybeSingle();
        if (error) throw error;
        if (data === null) throw publicError('ADMIN_USER_NOT_FOUND');
        if (!data || Array.isArray(data) || !sameId(data.id, id) || data.role !== role) {
            throw new Error('Admin role write unconfirmed.');
        }

        if (role === 'AGENT' || (role === 'REJECTED_AGENT' && reason)) {
            const rejectionReason = role === 'AGENT' ? null : reason;
            try {
                const result = await supabase.from('agent_profiles')
                    .update({ rejection_reason: rejectionReason }).eq('agent_id', id)
                    .select('agent_id, rejection_reason').maybeSingle();
                if (result.error || !result.data || Array.isArray(result.data)
                    || !sameId(result.data.agent_id, id) || result.data.rejection_reason !== rejectionReason) {
                    throw new Error('Agent profile write unconfirmed.');
                }
            } catch {
                console.error('admin_role_profile_recovery', { userId: id.toLowerCase(), stage: 'profile_confirmation' });
                throw publicError('ADMIN_ROLE_PARTIAL');
            }
        }
        return data;
    },

    // 13. Get Analytics Counts
    getAnalyticsCounts: async () => {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null);
        return { userCount, propertyCount };
    },

    // 14. Get Transactions Detailed
    getTransactionsDetailed: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                id, amount, currency, status, created_at, transaction_id, payment_method, property_id
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
            const { data, error } = await supabase.from('transactions').select('id, property_id, amount, currency, status, payment_method, created_at');
            if (error) throw error;
            dataToExport = data || [];
            headers = ['id', 'property_id', 'amount', 'currency', 'status', 'payment_method', 'created_at'];
        } else if (type === 'users') {
            const { data, error } = await supabase.from('users').select('id, name, email, role, created_at');
            if (error) throw error;
            dataToExport = data || [];
            headers = ['id', 'name', 'email', 'role', 'created_at'];
        } else if (type === 'listings') {
            const { data, error } = await supabase.from('properties').select('id, title, price, type, status, created_at').is('deleted_at', null);
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
            .select('setting_key, setting_value')
            .eq('setting_key', 'listing_fee').maybeSingle();
        if (error) throw error;
        if (data !== null && (!data || Array.isArray(data) || data.setting_key !== 'listing_fee'
            || typeof data.setting_value !== 'string')) throw new Error('Setting read unconfirmed.');
        return data;
    },

    // 17. Update Setting
    updatePlatformSetting: async (key, value) => {
        const { data, error } = await supabase
            .from('platform_settings')
            .upsert(
                { setting_key: key, setting_value: String(value) },
                { onConflict: 'setting_key' }
            ).select('setting_key, setting_value').maybeSingle();
        if (error) throw error;
        if (!data || Array.isArray(data) || data.setting_key !== key || data.setting_value !== String(value)) {
            throw new Error('Setting write unconfirmed.');
        }
        return data;
    },

    // 18. Get Role Upgrade Requests (with user info)
    getRoleRequests: async (statusFilter) => {
        let query = supabase
            .from('role_requests')
            .select(`
                id, requested_role, status, reason, created_at,
                user:users(id, name, email, role)
            `)
            .order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('status', statusFilter);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    // 19. Create Role Request (called from user-side auth controller)
    createRoleRequest: async (userId, requestedRole) => {
        const { data, error } = await supabase
            .from('role_requests')
            .insert({ user_id: userId, requested_role: requestedRole, status: 'pending' })
            .select('id, user_id, requested_role, status')
            .maybeSingle();
        if (!error) {
            if (!confirmedRequest(data, userId, requestedRole)) throw new Error('Seller request write unconfirmed.');
            return { created: true, request: data };
        }
        if (error.code !== '23505') throw error;
        const existing = await supabase.from('role_requests')
            .select('id, user_id, requested_role, status')
            .eq('user_id', userId).eq('status', 'pending').maybeSingle();
        if (existing.error) throw existing.error;
        if (!confirmedRequest(existing.data, userId, requestedRole)) throw publicError('SELLER_REQUEST_CONFLICT');
        return { created: false, request: existing.data };
    },

    // Atomic resolution requires the separately adopted database function.
    // Never fall back to sequential user/request writes.
    resolveSellerRoleRequest: async (requestId, decision) => supabase.rpc('resolve_seller_role_request', {
        p_request_id: requestId,
        p_decision: decision
    }),

    // Legacy primitive; not used by Admin role-request resolution.
    resolveRoleRequest: async (requestId, status) => {
        const { error } = await supabase
            .from('role_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', requestId);
        if (error) throw error;
    },

    // 21. Get single Role Request by id
    getRoleRequestById: async (requestId) => {
        const { data, error } = await supabase
            .from('role_requests')
            .select(`id, requested_role, status, user_id, user:users(id, name, email, role)`)
            .eq('id', requestId)
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = adminRepository;

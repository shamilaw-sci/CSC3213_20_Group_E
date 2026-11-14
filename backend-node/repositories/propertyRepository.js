const supabase = require('../config/supabase');

const propertyRepository = {
    // Shared: Get property by ID
    getPropertyById: async (id, { includeDeleted = false } = {}) => {
        let query = supabase
            .from('properties')
            .select('*, users(name, role)')
            .eq('id', id);
        if (!includeDeleted) query = query.is('deleted_at', null);
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Shared: Get Approved Properties For AI
    getApprovedPropertiesForAI: async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, description, price, type, bedrooms, bathrooms, land_size, district, city, images').is('deleted_at', null)
            .eq('status', 'approved');
        if (error) throw error;
        return data;
    },

    // Shared: Update Payment Status
    updatePaymentStatus: async (id, payment_status, status) => {
        const { data, error } = await supabase
            .from('properties')
            .update({ payment_status, status })
            .eq('id', id)
            .select('seller_id, title')
            .single();
        if (error) throw error;
        return data;
    },

    // Listings start pending; payment must never overwrite an admin decision.
    markListingPaidOnce: async (id) => {
        const { data, error } = await supabase
            .from('properties')
            .update({ payment_status: 'Paid' })
            .eq('id', id)
            .or('payment_status.is.null,payment_status.neq.Paid')
            .select('id, seller_id, title, status, payment_status')
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // 1. Add Property
    addProperty: async (propertyData) => {
        const { data, error } = await supabase
            .from('properties')
            .insert([propertyData])
            .select();
        if (error) throw error;
        return data[0];
    },

    // 1b. Upload Image
    uploadImage: async (filePath, buffer, mimeType) => {
        const { error } = await supabase.storage
            .from('properties')
            .upload(filePath, buffer, {
                contentType: mimeType
            });
        if (error) throw error;

        const { data } = supabase.storage
            .from('properties')
            .getPublicUrl(filePath);
        return data.publicUrl;
    },

    // 1c. Remove Images (Rollback)
    removeImages: async (filePaths) => {
        const { error } = await supabase.storage
            .from('properties')
            .remove(filePaths);
        if (error) throw error;
    },

    // 2. Get Properties (Paginated & Approved)
    getProperties: async (from, to) => {
        const { data, error, count } = await supabase
            .from('properties')
            .select('*, users(name, role)', { count: 'exact' }).is('deleted_at', null)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error) throw error;
        return { data, count };
    },

    // 3. Get My Properties (Seller - Paginated)
    getMyProperties: async (sellerId, from, to) => {
        const { data, error, count } = await supabase
            .from('properties')
            .select('*, users(name, role)', { count: 'exact' }).is('deleted_at', null)
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error) throw error;
        return { data, count };
    },

    // 4. Update My Property
    updateMyProperty: async (id, sellerId, updates) => {
        const { data, error } = await supabase
            .from('properties')
            .update(updates).is('deleted_at', null)
            .eq('id', id)
            .eq('seller_id', sellerId)
            .in('status', ['pending', 'rejected'])
            .select()
            .maybeSingle();
        return { data, error };
    },

    // 5. Delete My Property
    deleteMyProperty: async (id, sellerId) => {
        const { data, error } = await supabase
            .from('properties')
            .update({ deleted_at: new Date().toISOString() }).is('deleted_at', null)
            .eq('id', id)
            .eq('seller_id', sellerId)
            .select('id');
        if (error) throw error;
        if (!data?.length) {
            const { data: archived, error: lookupError } = await supabase.from('properties')
                .select('id,deleted_at').eq('id', id).eq('seller_id', sellerId).maybeSingle();
            if (lookupError) throw lookupError;
            return !!archived?.deleted_at;
        }
        return true;
    },

    // 6. Increment Views (Atomic RPC)
    incrementViews: async (id) => {
        // Try atomic RPC to prevent race conditions
        const { data, error } = await supabase.rpc('increment_property_views', { property_id: id });
        
        if (error) {
            console.error('property_atomic_rpc_failed');
            throw error; // Fail loudly rather than using a race-condition prone fallback
        }
        
        return data;
    }
};

module.exports = propertyRepository;

const supabase = require('../config/supabase');

const propertyRepository = {
    // Shared: Get property by ID
    getPropertyById: async (id) => {
        const { data, error } = await supabase
            .from('properties')
            .select('*, users(name, role)')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Shared: Get Approved Properties For AI
    getApprovedPropertiesForAI: async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, description, price, type, bedrooms, bathrooms, land_size, district, city, images')
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
            .select('*, users(name, role)', { count: 'exact' })
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
            .select('*, users(name, role)', { count: 'exact' })
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
            .update(updates)
            .eq('id', id)
            .eq('seller_id', sellerId)
            .select()
            .single();
        return { data, error };
    },

    // 5. Delete My Property
    deleteMyProperty: async (id, sellerId) => {
        const { data: prop, error: checkError } = await supabase
            .from('properties')
            .select('id')
            .eq('id', id)
            .eq('seller_id', sellerId)
            .single();
        if (checkError || !prop) return false; // Not found or unauthorized

        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // 6. Increment Views
    incrementViews: async (id) => {
        const { data: prop, error: fetchError } = await supabase
            .from('properties')
            .select('views_count')
            .eq('id', id)
            .single();
        if (fetchError) return null;

        const newCount = (prop.views_count || 0) + 1;
        const { error: updateError } = await supabase
            .from('properties')
            .update({ views_count: newCount })
            .eq('id', id);
        if (updateError) throw updateError;
        
        return newCount;
    }
};

module.exports = propertyRepository;

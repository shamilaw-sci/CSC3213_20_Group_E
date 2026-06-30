/**
 * @file propertyController.js
 * @description Controller responsible for handling property-related API requests including adding, fetching, and searching properties.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Add a new property listing to the database.
 * Processes uploaded images, formats property data, and saves it into Supabase.
 */
const addProperty = async (req, res) => {
    try {
        const { type, title, description, price, address, bedrooms, bathrooms, landSize,houseSize,contactNumber, latitude, longitude, boundary } = req.body;
        
        const files = req.files; 

        if (req.user.role !== 'SELLER') {
            return res.status(403).json({ message: "Only sellers can add properties." });
        }

        let imageUrls = [];

        // Upload images to Supabase Storage
        if (files && files.length > 0) {
            for (const file of files) {
                const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`; 
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('properties') 
                    .upload(`public/${fileName}`, file.buffer, { 
                        contentType: file.mimetype
                    });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('properties')
                    .getPublicUrl(`public/${fileName}`);

                imageUrls.push(publicUrlData.publicUrl);
            }
        }

        // Insert property data into Supabase properties table
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .insert([{
                type,
                title,
                description,
                price,
                address,
                bedrooms: bedrooms || null, // Default to null if not provided
                bathrooms: bathrooms || null,
                land_size: landSize || null,
                house_size: houseSize || null,
                contact_number: contactNumber || null,
                latitude,
                longitude,
                boundary: boundary, // Provided as a WKT String (POLYGON) directly from the frontend
                images: imageUrls,
                seller_id: req.user.id,
                status: 'pending',
                created_at: new Date()
            }])
            .select();

        if (propertyError) throw propertyError;

        res.status(201).json({ 
            message: "Property added successfully", 
            property: propertyData[0] 
        });

    } catch (error) {
        console.error("Backend Insert Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Retrieve all property listings from the database.
 * Sorted in descending order based on the creation date.
 */
const getProperties = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false }); 

        if (error) throw error;

        res.status(200).json({ 
            message: "Properties fetched successfully", 
            count: data.length, 
            properties: data 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Retrieve property submissions for the logged-in seller.
 * This includes pending/rejected listings so sellers can track review progress.
 */
const getMyProperties = async (req, res) => {
    try {
        if (req.user.role !== 'SELLER') {
            return res.status(403).json({ message: "Only sellers can view submitted properties." });
        }

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('seller_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            message: "Seller properties fetched successfully",
            count: data.length,
            properties: data
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a seller's own pending/rejected property submission.
 * Saving edits resubmits the property for admin review.
 */
const updateMyProperty = async (req, res) => {
    try {
        if (req.user.role !== 'SELLER') {
            return res.status(403).json({ message: "Only sellers can update submitted properties." });
        }

        const { data: existingProperty, error: fetchError } = await supabase
            .from('properties')
            .select('id, seller_id, status')
            .eq('id', req.params.id)
            .eq('seller_id', req.user.id)
            .single();

        if (fetchError || !existingProperty) {
            return res.status(404).json({ message: "Property not found." });
        }

        if (existingProperty.status === 'approved') {
            return res.status(400).json({ message: "Approved properties cannot be edited from this page." });
        }

        const { type, title, description, price, address, bedrooms, bathrooms, landSize, houseSize,  contactNumber } = req.body;
        const updates = {
            type,
            title,
            description,
            price,
            address,
            bedrooms: bedrooms || null,
            bathrooms: bathrooms || null,
            land_size: landSize || null,
            house_size: houseSize || null,
            contact_number: contactNumber || null,
            status: 'pending',
            rejection_reason: null
        };

        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

        let { data: property, error: updateError } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', req.params.id)
            .eq('seller_id', req.user.id)
            .select()
            .single();

        if (updateError && updateError.message?.includes('rejection_reason')) {
            const { rejection_reason, ...fallbackUpdates } = updates;
            const fallback = await supabase
                .from('properties')
                .update(fallbackUpdates)
                .eq('id', req.params.id)
                .eq('seller_id', req.user.id)
                .select()
                .single();
            property = fallback.data;
            updateError = fallback.error;
        }

        if (updateError) throw updateError;

        res.status(200).json({
            message: "Property updated and sent to admin review.",
            property
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Search for properties within a specific geographical polygon.
 * Utilizes a Supabase RPC call to perform PostGIS spatial queries.
 */
const searchProperties = async (req, res) => {
    try {
        const { polygon } = req.body; 

        if (!polygon) {
            return res.status(400).json({ message: "Polygon data is required." });
        }

        console.log("📍 Searching properties in polygon:", polygon);

        const { data, error } = await supabase
            .rpc('search_properties', { search_polygon: polygon });

        if (error) {
            console.error("🔥 Supabase RPC Error:", error);
            return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
        }

        res.status(200).json({
            message: "Search successful",
            count: data?.filter((property) => property.status === 'approved').length || 0,
            properties: data?.filter((property) => property.status === 'approved') || []
        });

    } catch (error) {
        console.error("🔥 Backend Catch Error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { addProperty, getProperties, getMyProperties, updateMyProperty, searchProperties };

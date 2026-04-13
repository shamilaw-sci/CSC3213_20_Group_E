const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Add new property listing
const addProperty = async (req, res) => {
    try {
        const { title, description, price, boundary } = req.body;
        const file = req.file; // Image file from multer middleware

        if (req.user.role !== 'SELLER') {
            return res.status(403).json({ message: "Only sellers can add properties." });
        }

        let imageUrl = null;

        // Upload image to Supabase Storage if provided
        if (file) {
            const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`; // Sanitize filename
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('properties') // Storage bucket
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype
                });

            if (uploadError) throw uploadError;

            // Get public URL for uploaded image
            const { data: publicUrlData } = supabase.storage
                .from('properties')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
        }

        // Insert property data into database
        const { data, error } = await supabase
            .from('properties')
            .insert([{
                seller_id: req.user.id,
                title,
                description,
                price,
                boundary,
                image_url: imageUrl // New image URL column
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: "Property added successfully.", property: data[0] });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Get all properties
const getProperties = async (req, res) => {
    try {
        // Fetch all properties from database
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false }); // Most recent first

        if (error) throw error;

        res.status(200).json({ 
            message: "Properties fetched successfully", 
            count: data.length, // Include count of properties
            properties: data 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Search properties within map polygon
const searchProperties = async (req, res) => {
    try {
        const { polygon } = req.body; // Polygon coordinates from frontend (WKT format)

        if (!polygon) {
            return res.status(400).json({ message: "Polygon data is required." });
        }

        // Call Supabase RPC function for spatial search
        const { data, error } = await supabase
            .rpc('search_properties', { search_polygon: polygon });

        if (error) throw error;

        res.status(200).json({
            message: "Search successful",
            count: data.length,
            properties: data
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { addProperty, getProperties, searchProperties };
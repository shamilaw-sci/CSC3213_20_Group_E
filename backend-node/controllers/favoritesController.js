const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const toggleFavorite = async (req, res, next) => {
    try {
        const propertyId = req.params.propertyId;
        const userId = req.user.id;

        // Check if it's already favorited
        const { data: existing, error: checkError } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('property_id', propertyId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            // If table doesn't exist, it will throw a different error
            if (checkError.message.includes('relation "public.favorites" does not exist')) {
                 return res.status(500).json({ message: "Favorites table does not exist in the database. Please create it with user_id and property_id columns." });
            }
            throw checkError;
        }

        if (existing) {
            // Remove from favorites
            const { error: deleteError } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('property_id', propertyId);
            if (deleteError) throw deleteError;
            return res.status(200).json({ message: "Removed from favorites", isFavorite: false });
        } else {
            // Add to favorites
            const { error: insertError } = await supabase
                .from('favorites')
                .insert([{ user_id: userId, property_id: propertyId }]);
            if (insertError) throw insertError;
            return res.status(200).json({ message: "Added to favorites", isFavorite: true });
        }
    } catch (error) {
        next(error);
    }
};

const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data: favorites, error } = await supabase
            .from('favorites')
            .select('property_id, properties(*)')
            .eq('user_id', userId);

        if (error) {
            if (error.message.includes('relation "public.favorites" does not exist')) {
                 return res.status(200).json({ favorites: [], message: "Favorites table not setup yet." });
            }
            throw error;
        }

        // Extract just the properties array
        const properties = favorites.map(fav => fav.properties).filter(Boolean);

        res.status(200).json({ favorites: properties });
    } catch (error) {
        next(error);
    }
};

module.exports = { toggleFavorite, getFavorites };

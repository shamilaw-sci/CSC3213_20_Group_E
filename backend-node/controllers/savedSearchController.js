const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const saveSearch = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, polygon, beds, baths, property_type } = req.body;

        const { data, error } = await supabase
            .from('saved_searches')
            .insert([{ 
                user_id: userId, 
                title: title || 'My Saved Search',
                polygon, 
                beds, 
                baths, 
                property_type 
            }])
            .select();

        if (error) {
            if (error.message.includes('relation "public.saved_searches" does not exist')) {
                return res.status(500).json({ message: "saved_searches table does not exist in the database." });
            }
            throw error;
        }

        res.status(201).json({ message: "Search saved successfully", savedSearch: data[0] });
    } catch (error) {
        next(error);
    }
};

const getSavedSearches = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('saved_searches')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message.includes('relation "public.saved_searches" does not exist')) {
                return res.status(200).json({ savedSearches: [], message: "Table not created yet." });
            }
            throw error;
        }

        res.status(200).json({ savedSearches: data });
    } catch (error) {
        next(error);
    }
};

const deleteSavedSearch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from('saved_searches')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.status(200).json({ message: "Saved search deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { saveSearch, getSavedSearches, deleteSavedSearch };

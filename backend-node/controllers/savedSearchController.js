const savedSearchRepository = require('../repositories/savedSearchRepository');

const saveSearch = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, polygon, beds, baths, property_type } = req.body;

        const { data, error } = await savedSearchRepository.insertSavedSearch({ 
            user_id: userId, 
            title: title || 'My Saved Search',
            polygon, 
            beds, 
            baths, 
            property_type 
        });

        if (error) {
            if (error.message.includes('relation "public.saved_searches" does not exist')) {
                return next(new Error("saved_searches table does not exist in the database."));
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

        const { data, error } = await savedSearchRepository.getSavedSearchesByUser(userId);

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

        await savedSearchRepository.deleteSavedSearchById(id, userId);

        res.status(200).json({ message: "Saved search deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { saveSearch, getSavedSearches, deleteSavedSearch };

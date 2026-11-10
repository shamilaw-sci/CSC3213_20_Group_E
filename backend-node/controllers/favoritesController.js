const favoritesRepository = require('../repositories/favoritesRepository');
const propertyRepository = require('../repositories/propertyRepository');

const toggleFavorite = async (req, res, next) => {
    try {
        const propertyId = req.params.propertyId;
        const userId = req.user.id;

        // Existing account-owned favorites remain removable after a listing is withdrawn.
        const { data: existing, error: checkError } = await favoritesRepository.findFavorite(userId, propertyId);

        if (checkError) {
            if (checkError.message?.includes('relation "public.favorites" does not exist')) {
                 return next(new Error("Favorites table does not exist in the database. Please create it with user_id and property_id columns."));
            }
            throw checkError;
        }

        if (existing) {
            await favoritesRepository.deleteFavorite(userId, propertyId);
            return res.status(200).json({ message: "Removed from favorites", isFavorite: false });
        }

        const property = await propertyRepository.getPropertyById(propertyId);
        if (!property || property.status !== 'approved') {
            return res.status(404).json({ message: "Property not found." });
        }
        if (property.seller_id === userId) {
            return res.status(400).json({ message: "You cannot favorite your own property listing." });
        }
        await favoritesRepository.insertFavorite(userId, propertyId);
        return res.status(200).json({ message: "Added to favorites", isFavorite: true });
    } catch (error) {
        next(error);
    }
};

const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data: favorites, error } = await favoritesRepository.getUserFavorites(userId);

        if (error) {
            if (error.message.includes('relation "public.favorites" does not exist')) {
                 return res.status(200).json({ favorites: [], message: "Favorites are temporarily unavailable." });
            }
            throw error;
        }

        // Extract just the properties array
        const properties = (favorites || []).map(fav => fav?.properties)
            .filter(property => property?.status === 'approved');

        res.status(200).json({ favorites: properties });
    } catch (error) {
        next(error);
    }
};

module.exports = { toggleFavorite, getFavorites };
